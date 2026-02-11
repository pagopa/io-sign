import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
  app
} from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { ContainerClient } from "@azure/storage-blob";
import { QueueClient } from "@azure/storage-queue";
import {
  EventHubConsumerClient,
  EventHubProducerClient
} from "@azure/event-hubs";

import { createIOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import { createPdvTokenizerClient } from "@io-sign/io-sign/infra/pdv-tokenizer/client";

import * as E from "fp-ts/lib/Either";
import { identity, pipe } from "fp-ts/lib/function";

import * as t from "io-ts";
import { PdvTokenizerSignerRepository } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { ApplicationInsights } from "@io-sign/io-sign/infra/azure/appinsights/index";
import { initAppInsights } from "@pagopa/ts-commons/lib/appinsights";
import { IONotificationService } from "@io-sign/io-sign/infra/io-services/message";
import { makeGetSignerFunction } from "../infra/azure/functions/get-signer";
import { makeGetUploadUrlFunction } from "../infra/azure/functions/get-upload-url";
import { makeInfoFunction } from "../infra/azure/functions/info";
import { makeSendNotificationFunction } from "../infra/azure/functions/send-notification";

import { makeRequestAsWaitForSignatureFunction } from "../infra/azure/functions/mark-as-wait-for-signature";

import { makeCreateIssuerFunction } from "../infra/azure/functions/create-issuer";
import { run as CreateIssuerByVatNumberViewHandler } from "../infra/azure/functions/create-issuers-by-vat-number-view";

import { GetDossierFunction } from "../infra/azure/functions/get-dossier";
import { BackOfficeIssuerRepository } from "../infra/back-office/issuer";
import { CosmosDbDossierRepository } from "../infra/azure/cosmos/dossier";
import { CreateDossierFunction } from "../infra/azure/functions/create-dossier";
import { GetRequestsByDossierFunction } from "../infra/azure/functions/get-requests-by-dossier";
import { GetSignatureRequestFunction } from "../infra/azure/functions/get-signature-request";
import { CosmosDbSignatureRequestRepository } from "../infra/azure/cosmos/signature-request";
import { ValidateUploadFunction } from "../infra/azure/functions/validate-upload";
import { CloseSignatureRequestFunction } from "../infra/azure/functions/close-signature-request";
import { CosmosDbUploadMetadataRepository } from "../infra/azure/cosmos/upload";

import { BlobStorageFileStorage } from "../infra/azure/storage/upload";
import { CreateSignatureRequestFunction } from "../infra/azure/functions/create-signature-request";
import { SetSignatureRequestStatusFunction } from "../infra/azure/functions/set-signature-request-status";
import { validateDocumentFunction } from "../infra/azure/functions/validate-document";
import { ClosedSignatureRequest } from "../signature-request";
import { getConfigFromEnvironment } from "./config";

interface V3Context {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  req: HttpRequest;
  res?: HttpResponseInit;
  done: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log: (...args: any[]) => void;
}

const v3ToV4Adapter =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (v3Handler: any) =>
    async (
      request: HttpRequest,
      context: InvocationContext
    ): Promise<HttpResponseInit> => {
      const v3Context: V3Context = {
        ...context,
        req: request,
        res: undefined,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        done: () => {},
        log: context.log
      };

      await v3Handler(v3Context, request);

      return v3Context.res || { status: 500, body: "Internal Server Error" };
    };

const configOrError = pipe(
  getConfigFromEnvironment(process.env),
  E.getOrElseW(identity)
);

if (configOrError instanceof Error) {
  throw configOrError;
}

const config = configOrError;

const cosmosClient = new CosmosClient(config.azure.cosmos.connectionString);
const database = cosmosClient.database(config.azure.cosmos.dbName);

const eventHubBillingClient = new EventHubProducerClient(
  config.azure.eventHubs.billingConnectionString,
  "billing"
);

const eventAnalyticsClient = new EventHubProducerClient(
  config.azure.eventHubs.analyticsConnectionString,
  "analytics"
);

const eventHubSelfCareContractsConsumer = new EventHubConsumerClient(
  EventHubConsumerClient.defaultConsumerGroupName,
  config.pagopa.selfCare.eventHub.connectionString,
  config.pagopa.selfCare.eventHub.contractsName
);

const pdvTokenizerClientWithApiKey = createPdvTokenizerClient(
  config.pagopa.tokenizer.basePath,
  config.pagopa.tokenizer.apiKey
);

const ioApiClient = createIOApiClient(
  config.pagopa.ioServices.basePath,
  config.pagopa.ioServices.subscriptionKey
);

const notificationService = new IONotificationService(
  ioApiClient,
  config.pagopa.ioServices.configurationId
);

const telemetryClient = initAppInsights(
  config.azure.appinsights.instrumentationKey,
  {
    samplingPercentage: config.azure.appinsights.samplingPercentage
  }
);

const telemetryService = new ApplicationInsights(telemetryClient);

const issuerRepository = new BackOfficeIssuerRepository(
  config.backOffice.basePath,
  config.backOffice.apiKey
);
const dossierRepository = new CosmosDbDossierRepository(database);

const uploadMetadataRepository = new CosmosDbUploadMetadataRepository(database);

const signatureRequestRepository = new CosmosDbSignatureRequestRepository(
  database.container("signature-requests")
);

const signerRepository = new PdvTokenizerSignerRepository(
  pdvTokenizerClientWithApiKey
);

const uploadedContainerClient = new ContainerClient(
  config.azure.storage.connectionString,
  "uploaded-documents"
);

const validatedContainerClient = new ContainerClient(
  config.azure.storage.connectionString,
  "validated-documents"
);

const uploadedFileStorage = new BlobStorageFileStorage(uploadedContainerClient);

const validatedFileStorage = new BlobStorageFileStorage(
  validatedContainerClient
);

const signedContainerClient = new ContainerClient(
  config.azure.storage.connectionString,
  "signed-documents"
);

const onSignatureRequestReadyQueueClient = new QueueClient(
  config.azure.storage.connectionString,
  "on-signature-request-ready"
);

const WaitingForSignatureRequestUpdatesQueueClient = new QueueClient(
  config.azure.storage.connectionString,
  "waiting-for-signature-request-updates"
);

// Info function
const info = makeInfoFunction(
  pdvTokenizerClientWithApiKey,
  ioApiClient,
  database,
  eventHubBillingClient,
  eventAnalyticsClient,
  eventHubSelfCareContractsConsumer,
  uploadedContainerClient,
  validatedContainerClient,
  onSignatureRequestReadyQueueClient
);

app.http("info", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "info",
  handler: v3ToV4Adapter(info)
});

// MarkAsWaitForSignature queue function
const markAsWaitForSignature = makeRequestAsWaitForSignatureFunction(database);

app.storageQueue("markAsWaitForSignature", {
  queueName: "on-signature-request-wait-for-signature",
  connection: "StorageAccountConnectionString",
  handler: markAsWaitForSignature
});

// CloseSignatureRequest queue function (used by both MarkAsRejected and MarkAsSigned)
const closeSignatureRequest = CloseSignatureRequestFunction({
  signatureRequestRepository,
  signerRepository,
  telemetryService,
  notificationService,
  eventAnalyticsClient,
  billingEventProducer: eventHubBillingClient,
  inputDecoder: ClosedSignatureRequest
});

app.storageQueue("markAsRejected", {
  queueName: "on-signature-request-rejected",
  connection: "StorageAccountConnectionString",
  handler: closeSignatureRequest
});

app.storageQueue("markAsSigned", {
  queueName: "on-signature-request-signed",
  connection: "StorageAccountConnectionString",
  handler: closeSignatureRequest
});

// GetSignerByFiscalCode HTTP function
const getSignerByFiscalCode = makeGetSignerFunction(
  pdvTokenizerClientWithApiKey,
  ioApiClient
);

app.http("getSignerByFiscalCode", {
  methods: ["POST"],
  authLevel: "function",
  route: "signers",
  handler: v3ToV4Adapter(getSignerByFiscalCode)
});

// GetUploadUrl HTTP function
const getUploadUrl = makeGetUploadUrlFunction(
  database,
  uploadedContainerClient
);

app.http("getUploadUrl", {
  methods: ["POST"],
  authLevel: "function",
  route:
    "signature-requests/{signatureRequestId}/documents/{documentId}/upload-url",
  handler: v3ToV4Adapter(getUploadUrl)
});

// SendNotification queue function
const sendNotification = makeSendNotificationFunction(
  database,
  pdvTokenizerClientWithApiKey,
  ioApiClient,
  config.pagopa.ioServices.configurationId,
  eventAnalyticsClient
);

app.storageQueue("sendNotification", {
  queueName: "on-signature-request-ready",
  connection: "StorageAccountConnectionString",
  handler: sendNotification
});

// CreateIssuer HTTP function
const createIssuer = makeCreateIssuerFunction(
  database,
  config.pagopa.selfCare,
  config.slack
);

app.http("createIssuer", {
  methods: ["POST"],
  authLevel: "function",
  route: "issuers",
  handler: v3ToV4Adapter(createIssuer)
});

// CreateIssuerByVatNumberView Cosmos DB trigger
app.cosmosDB("createIssuerByVatNumberView", {
  databaseName: "%CosmosDbDatabaseName%",
  containerName: "issuers",
  connection: "CosmosDbConnectionString",
  leaseContainerName: "leases",
  leaseContainerPrefix: "issuers-by-vat",
  createLeaseContainerIfNotExists: true,
  startFromBeginning: true,
  handler: CreateIssuerByVatNumberViewHandler
});

// GetDossier HTTP function
const getDossier = GetDossierFunction({
  issuerRepository,
  dossierRepository
});

app.http("getDossier", {
  methods: ["GET"],
  authLevel: "function",
  route: "dossiers/{dossierId}",
  handler: v3ToV4Adapter(getDossier)
});

// CreateDossier HTTP function
const createDossier = CreateDossierFunction({
  issuerRepository,
  dossierRepository
});

app.http("createDossier", {
  methods: ["POST"],
  authLevel: "function",
  route: "dossiers",
  handler: v3ToV4Adapter(createDossier)
});

// GetRequestsByDossier HTTP function
const getRequestsByDossier = GetRequestsByDossierFunction({
  signatureRequestRepository,
  issuerRepository,
  dossierRepository
});

app.http("getRequestsByDossier", {
  methods: ["GET"],
  authLevel: "function",
  route: "dossiers/{dossierId}/signature-requests",
  handler: v3ToV4Adapter(getRequestsByDossier)
});

// ValidateUpload queue function
const validateUpload = ValidateUploadFunction({
  signatureRequestRepository,
  uploadMetadataRepository,
  uploadedFileStorage,
  validatedFileStorage,
  inputDecoder: t.type({ uri: t.string }),
  eventAnalyticsClient
});

app.storageQueue("validateUpload", {
  queueName: "on-document-uploaded",
  connection: "StorageAccountConnectionString",
  handler: validateUpload
});

// ValidateDocument HTTP function
const validateDocument = validateDocumentFunction({
  issuerRepository
});

app.http("validateDocument", {
  methods: ["POST"],
  authLevel: "function",
  route: "documents/{documentId}/validate",
  handler: v3ToV4Adapter(validateDocument)
});

// GetSignatureRequest HTTP function
const getSignatureRequest = GetSignatureRequestFunction({
  issuerRepository,
  signatureRequestRepository,
  signedContainerClient
});

app.http("getSignatureRequest", {
  methods: ["GET"],
  authLevel: "function",
  route: "signature-requests/{signatureRequestId}",
  handler: v3ToV4Adapter(getSignatureRequest)
});

// CreateSignatureRequest HTTP function
const createSignatureRequest = CreateSignatureRequestFunction({
  issuerRepository,
  dossierRepository,
  signatureRequestRepository,
  eventAnalyticsClient
});

app.http("createSignatureRequest", {
  methods: ["POST"],
  authLevel: "function",
  route: "dossiers/{dossierId}/signature-requests",
  handler: v3ToV4Adapter(createSignatureRequest)
});

// SetSignatureRequestStatus HTTP function
const setSignatureRequestStatus = SetSignatureRequestStatusFunction({
  issuerRepository,
  signatureRequestRepository,
  eventAnalyticsClient,
  ready: onSignatureRequestReadyQueueClient,
  updated: WaitingForSignatureRequestUpdatesQueueClient
});

app.http("setSignatureRequestStatus", {
  methods: ["POST"],
  authLevel: "function",
  route: "signature-requests/{signatureRequestId}/status",
  handler: v3ToV4Adapter(setSignatureRequestStatus)
});
