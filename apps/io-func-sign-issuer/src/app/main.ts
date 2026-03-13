import { app } from "@azure/functions";
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

import { PdvTokenizerSignerRepository } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { ApplicationInsights } from "@io-sign/io-sign/infra/azure/appinsights/index";
import { initAppInsights } from "@pagopa/ts-commons/lib/appinsights";
import { IONotificationService } from "@io-sign/io-sign/infra/io-services/message";
import { SignatureRequestToBeSigned } from "@io-sign/io-sign/signature-request";

import { InfoFunction } from "../infra/azure/functions/info";
import { GetSignerFunction } from "../infra/azure/functions/get-signer";
import { GetUploadUrlFunction } from "../infra/azure/functions/get-upload-url";
import { SendNotificationFunction } from "../infra/azure/functions/send-notification";
import { MarkAsWaitForSignatureFunction } from "../infra/azure/functions/mark-as-wait-for-signature";
import { makeCreateIssuerHandler } from "../infra/azure/functions/create-issuer";
import { makeCreateIssuersByVatNumberViewHandler } from "../infra/azure/functions/create-issuers-by-vat-number-view";

import { GetDossierFunction } from "../infra/azure/functions/get-dossier";
import { BackOfficeIssuerRepository } from "../infra/back-office/issuer";
import { CosmosDbDossierRepository } from "../infra/azure/cosmos/dossier";
import { CreateDossierFunction } from "../infra/azure/functions/create-dossier";
import { GetRequestsByDossierFunction } from "../infra/azure/functions/get-requests-by-dossier";
import { GetSignatureRequestFunction } from "../infra/azure/functions/get-signature-request";
import { CosmosDbSignatureRequestRepository } from "../infra/azure/cosmos/signature-request";
import { makeValidateUploadBlobHandler } from "../infra/azure/functions/validate-upload";
import { CloseSignatureRequestFunction } from "../infra/azure/functions/close-signature-request";
import { CosmosDbUploadMetadataRepository } from "../infra/azure/cosmos/upload";

import { BlobStorageFileStorage } from "../infra/azure/storage/upload";
import { CreateSignatureRequestFunction } from "../infra/azure/functions/create-signature-request";
import { SetSignatureRequestStatusFunction } from "../infra/azure/functions/set-signature-request-status";
import { validateDocumentFunction } from "../infra/azure/functions/validate-document";
import { ClosedSignatureRequest } from "../signature-request";
import { getConfigFromEnvironment } from "./config";

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

// ---- HTTP TRIGGERS ----

const info = InfoFunction({
  pdvTokenizerClient: pdvTokenizerClientWithApiKey,
  ioApiClient,
  db: database,
  eventHubBillingClient,
  eventHubAnalyticsClient: eventAnalyticsClient,
  eventHubSelfCareContractsConsumer,
  uploadedContainerClient,
  validatedContainerClient,
  onSignatureRequestReadyQueueClient
});

app.http("info", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "info",
  handler: info
});

const getSignerByFiscalCode = GetSignerFunction({
  pdvTokenizerClient: pdvTokenizerClientWithApiKey,
  ioApiClient
});

app.http("getSignerByFiscalCode", {
  methods: ["POST"],
  authLevel: "function",
  route: "signers",
  handler: getSignerByFiscalCode
});

const getUploadUrl = GetUploadUrlFunction({
  db: database,
  uploadedContainerClient,
  issuerRepository
});

app.http("getUploadUrl", {
  methods: ["GET"],
  authLevel: "function",
  route:
    "signature-requests/{signatureRequestId}/documents/{documentId}/upload_url",
  handler: getUploadUrl
});

const sendNotification = SendNotificationFunction({
  db: database,
  pdvTokenizerClient: pdvTokenizerClientWithApiKey,
  ioApiClient,
  configurationId: config.pagopa.ioServices.configurationId,
  eventHubAnalyticsClient: eventAnalyticsClient,
  issuerRepository
});

app.http("sendNotification", {
  methods: ["PUT"],
  authLevel: "function",
  route: "signature-requests/{signatureRequestId}/notification",
  handler: sendNotification
});

const getDossier = GetDossierFunction({
  issuerRepository,
  dossierRepository
});

app.http("getDossier", {
  methods: ["GET"],
  authLevel: "function",
  route: "dossiers/{dossierId}",
  handler: getDossier
});

const createDossier = CreateDossierFunction({
  issuerRepository,
  dossierRepository
});

app.http("createDossier", {
  methods: ["POST"],
  authLevel: "function",
  route: "dossiers",
  handler: createDossier
});

const getRequestsByDossier = GetRequestsByDossierFunction({
  signatureRequestRepository,
  issuerRepository,
  dossierRepository
});

app.http("getRequestsByDossier", {
  methods: ["GET"],
  authLevel: "function",
  route: "dossiers/{dossierId}/signature-requests",
  handler: getRequestsByDossier
});

const getSignatureRequest = GetSignatureRequestFunction({
  issuerRepository,
  signatureRequestRepository,
  signedContainerClient
});

app.http("getSignatureRequest", {
  methods: ["GET"],
  authLevel: "function",
  route: "signature-requests/{signatureRequestId}",
  handler: getSignatureRequest
});

const createSignatureRequest = CreateSignatureRequestFunction({
  issuerRepository,
  dossierRepository,
  signatureRequestRepository,
  eventAnalyticsClient
});

app.http("createSignatureRequest", {
  methods: ["POST"],
  authLevel: "function",
  route: "signature-requests",
  handler: createSignatureRequest
});

const setSignatureRequestStatus = SetSignatureRequestStatusFunction({
  issuerRepository,
  signatureRequestRepository,
  eventAnalyticsClient,
  ready: onSignatureRequestReadyQueueClient,
  updated: WaitingForSignatureRequestUpdatesQueueClient
});

app.http("setSignatureRequestStatus", {
  methods: ["PUT"],
  authLevel: "function",
  route: "signature-requests/{signatureRequestId}/status",
  handler: setSignatureRequestStatus
});

const validateDocument = validateDocumentFunction({
  issuerRepository
});

app.http("validateDocument", {
  methods: ["POST"],
  authLevel: "function",
  route: "validate-document",
  handler: validateDocument
});

// ---- QUEUE TRIGGERS ----

const markAsWaitForSignature = MarkAsWaitForSignatureFunction({
  db: database,
  inputDecoder: SignatureRequestToBeSigned
});

app.storageQueue("markAsWaitForSignature", {
  queueName: "on-signature-request-wait-for-signature",
  connection: "StorageAccountConnectionString",
  handler: markAsWaitForSignature
});

const closeSignatureRequestSigned = CloseSignatureRequestFunction({
  signatureRequestRepository,
  signerRepository,
  telemetryService,
  notificationService,
  eventAnalyticsClient,
  billingEventProducer: eventHubBillingClient,
  inputDecoder: ClosedSignatureRequest
});

app.storageQueue("closeSignatureRequestSigned", {
  queueName: "on-signature-request-signed",
  connection: "StorageAccountConnectionString",
  handler: closeSignatureRequestSigned
});

const closeSignatureRequestRejected = CloseSignatureRequestFunction({
  signatureRequestRepository,
  signerRepository,
  telemetryService,
  notificationService,
  eventAnalyticsClient,
  billingEventProducer: eventHubBillingClient,
  inputDecoder: ClosedSignatureRequest
});

app.storageQueue("closeSignatureRequestRejected", {
  queueName: "on-signature-request-rejected",
  connection: "StorageAccountConnectionString",
  handler: closeSignatureRequestRejected
});

// ---- BLOB TRIGGER ----
// Note: this function was originally disabled (disabled: true in function.json).
// To keep it disabled at runtime set app setting: AzureWebJobs.validateUpload.Disabled = true

const validateUpload = makeValidateUploadBlobHandler({
  signatureRequestRepository,
  uploadMetadataRepository,
  uploadedFileStorage,
  validatedFileStorage,
  eventAnalyticsClient
});

app.storageBlob("validateUpload", {
  path: "uploaded-documents/{name}",
  connection: "StorageAccountConnectionString",
  handler: validateUpload
});

// ---- EVENT HUB TRIGGER ----

app.eventHub("createIssuer", {
  connection: "SelfCareEventHubConnectionString",
  eventHubName: "sc-contracts",
  cardinality: "many",
  handler: makeCreateIssuerHandler(
    database,
    config.pagopa.selfCare,
    config.slack
  )
});

// ---- COSMOS DB TRIGGER ----

const { issuersByVatNumberViewOutput, handler: createIssuersByVatNumberView } =
  makeCreateIssuersByVatNumberViewHandler();

app.cosmosDB("createIssuerByVatNumberView", {
  connection: "CosmosDbConnectionString",
  databaseName: "%CosmosDbDatabaseName%",
  containerName: "issuers",
  leaseContainerName: "leases",
  leaseContainerPrefix: "issuers-by-vat",
  createLeaseContainerIfNotExists: true,
  startFromBeginning: true,
  extraOutputs: [issuersByVatNumberViewOutput],
  handler: createIssuersByVatNumberView
});
