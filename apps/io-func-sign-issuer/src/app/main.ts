import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { ContainerClient } from "@azure/storage-blob";
import { BaseContainerClientWithFallback } from "@pagopa/azure-storage-migration-kit";
import { QueueClient } from "@azure/storage-queue";
import { EventHubProducerClient } from "@azure/event-hubs";

import { createIOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import { createPdvTokenizerClient } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { Millisecond } from "@pagopa/ts-commons/lib/units";

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

// ITN — primary
const eventHubBillingClient = new EventHubProducerClient(
  config.azure.eventHubs.billingItnConnectionString,
  "io-p-itn-sign-billing-01"
);

const eventAnalyticsClient = new EventHubProducerClient(
  config.azure.eventHubs.analyticsItnConnectionString,
  "io-p-itn-sign-analytics-01"
);

// WEU legacy — rimuovere dopo che PDND ha fatto lo switch a ITN
const legacyEventHubBillingClient = new EventHubProducerClient(
  config.azure.eventHubs.billingConnectionString,
  "billing"
);

const legacyEventAnalyticsClient = new EventHubProducerClient(
  config.azure.eventHubs.analyticsConnectionString,
  "analytics"
);

const pdvTokenizerClientWithApiKey = createPdvTokenizerClient(
  config.pagopa.tokenizer.basePath,
  config.pagopa.tokenizer.apiKey,
  3000 as Millisecond
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
  config.azure.appinsights.connectionString,
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
  config.azure.storage.connectionStringItn,
  "uploaded-documents"
);

const validatedContainerClient = new ContainerClient(
  config.azure.storage.connectionStringItn,
  "validated-documents"
);

const uploadedFileStorage = new BlobStorageFileStorage(uploadedContainerClient);

const validatedFileStorage = new BlobStorageFileStorage(
  validatedContainerClient
);

// ITN is the new primary for signed-documents (QTSP will write here after migration).
const signedContainerClientItn = new ContainerClient(
  config.azure.storage.connectionStringItn,
  "signed-documents"
);

// WEU is kept as the fallback: blobs signed before the migration still live here.
const signedContainerClient = new ContainerClient(
  config.azure.storage.connectionString,
  "signed-documents"
);

// Reads try ITN first and fall back to WEU; writes always go to ITN.
const signedContainerClientWithFallback = new BaseContainerClientWithFallback(
  signedContainerClientItn,
  signedContainerClient
);

const onSignatureRequestReadyQueueClient = new QueueClient(
  config.azure.storage.connectionStringItn,
  "on-signature-request-ready"
);

const waitingForSignatureRequestUpdatesQueueClient = new QueueClient(
  config.azure.storage.connectionStringItn,
  "waiting-for-signature-request-updates"
);

// ---- HTTP TRIGGERS ----

const info = InfoFunction({
  pdvTokenizerClient: pdvTokenizerClientWithApiKey,
  ioApiClient,
  db: database,
  eventHubBillingClient,
  eventHubAnalyticsClient: eventAnalyticsClient,
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
  signerRepository,
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
  signerRepository,
  notificationService,
  eventHubAnalyticsClient: eventAnalyticsClient,
  legacyEventHubAnalyticsClient: legacyEventAnalyticsClient, // WEU — rimuovere dopo che PDND ha fatto lo switch a ITN
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
  signedContainerClient: signedContainerClientWithFallback
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
  eventAnalyticsClient,
  legacyEventAnalyticsClient // WEU — rimuovere dopo che PDND ha fatto lo switch a ITN
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
  legacyEventAnalyticsClient, // WEU — rimuovere dopo che PDND ha fatto lo switch a ITN
  ready: onSignatureRequestReadyQueueClient,
  updated: waitingForSignatureRequestUpdatesQueueClient
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
  connection: "StorageAccountItnConnectionString",
  handler: markAsWaitForSignature
});

const closeSignatureRequest = CloseSignatureRequestFunction({
  signatureRequestRepository,
  signerRepository,
  telemetryService,
  notificationService,
  eventAnalyticsClient,
  legacyEventAnalyticsClient, // WEU — rimuovere dopo che PDND ha fatto lo switch a ITN
  billingEventProducer: eventHubBillingClient,
  legacyBillingEventProducer: legacyEventHubBillingClient, // WEU — rimuovere dopo che PDND ha fatto lo switch a ITN
  inputDecoder: ClosedSignatureRequest
});

app.storageQueue("closeSignatureRequestSigned", {
  queueName: "on-signature-request-signed",
  connection: "StorageAccountItnConnectionString",
  handler: closeSignatureRequest
});

app.storageQueue("closeSignatureRequestRejected", {
  queueName: "on-signature-request-rejected",
  connection: "StorageAccountItnConnectionString",
  handler: closeSignatureRequest
});

// ---- BLOB TRIGGER ----
// Note: this function was originally disabled (disabled: true in function.json).
// To keep it disabled at runtime set app setting: AzureWebJobs.validateUpload.Disabled = true

const validateUpload = makeValidateUploadBlobHandler({
  signatureRequestRepository,
  uploadMetadataRepository,
  uploadedFileStorage,
  validatedFileStorage,
  eventAnalyticsClient,
  legacyEventAnalyticsClient // WEU — rimuovere dopo che PDND ha fatto lo switch a ITN
});

app.storageBlob("validateUpload", {
  path: "uploaded-documents/{name}",
  connection: "StorageAccountItnConnectionString",
  handler: validateUpload
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
