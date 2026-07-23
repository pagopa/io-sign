import { app } from "@azure/functions";
import { ContainerClient } from "@azure/storage-blob";
import { QueueClient } from "@azure/storage-queue";
import { createPdvTokenizerClient } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { PdvTokenizerSignerRepository } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";

import * as E from "fp-ts/lib/Either";
import { identity, pipe } from "fp-ts/lib/function";

import { CosmosClient } from "@azure/cosmos";
import { createIOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import { createIoProfileClient } from "@io-sign/io-sign/infra/io-profile/client";
import { makeGetValidatedEmailByFiscalCode } from "@io-sign/io-sign/infra/io-profile/profile";

import { makeGenerateSignatureRequestQrCode } from "@io-sign/io-sign/infra/io-link/qr-code";
import { EventHubProducerClient } from "@azure/event-hubs";
import {
  SignatureRequestCancelled,
  SignatureRequestReady
} from "@io-sign/io-sign/signature-request";
import { CreateFilledDocumentFunction } from "../infra/azure/functions/create-filled-document";
import { FillDocumentFunction } from "../infra/azure/functions/fill-document";
import { GetSignerByFiscalCodeFunction } from "../infra/azure/functions/get-signer-by-fiscal-code";
import { GetQtspClausesMetadataFunction } from "../infra/azure/functions/get-qtsp-clauses-metadata";
import { CreateSignatureFunction } from "../infra/azure/functions/create-signature";
import { CreateSignatureRequestFunction } from "../infra/azure/functions/create-signature-request";
import { ValidateSignatureFunction } from "../infra/azure/functions/validate-signature";
import { FillDocumentPayload } from "../filled-document";
import { ValidateSignaturePayload } from "./use-cases/validate-signature";
import { GetThirdPartyMessageDetailsFunction } from "../infra/azure/functions/get-third-party-message-details";
import { GetThirdPartyMessageAttachmentContentFunction } from "../infra/azure/functions/get-third-party-message-attachments-content";
import {
  createLollipopApiClientExt,
  createLollipopApiClientInt
} from "../infra/lollipop/client";
import { GetSignatureRequestsFunction } from "../infra/azure/functions/get-signature-requests";
import { CosmosDbSignatureRequestRepository } from "../infra/azure/cosmos/signature-request";
import { GetSignatureRequestFunction } from "../infra/azure/functions/get-signature-request";
import { UpdateSignatureRequestFunction } from "../infra/azure/functions/update-signature-request";
import { InfoFunction } from "../infra/azure/functions/info";
import { GetMetadataFunction } from "../infra/azure/functions/get-metadata";
import { getConfigFromEnvironment } from "./config";
import { BaseContainerClientWithFallback } from "@pagopa/azure-storage-migration-kit";

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

const eventHubAnalyticsClient = new EventHubProducerClient(
  config.azure.eventHubs.analyticsItnConnectionString,
  "io-p-itn-sign-analytics-01"
);

const filledContainerClient = new ContainerClient(
  config.azure.storage.connectionStringItn,
  "filled-modules"
);

const documentsToFillQueue = new QueueClient(
  config.azure.storage.connectionStringItn,
  "waiting-for-documents-to-fill"
);

const qtspQueue = new QueueClient(
  config.azure.storage.connectionStringItn,
  "waiting-for-qtsp"
);

const onWaitForSignatureQueueClient = new QueueClient(
  config.azure.storage.connectionStringItn,
  "on-signature-request-wait-for-signature"
);

const onSignedQueueClient = new QueueClient(
  config.azure.storage.connectionStringItn,
  "on-signature-request-signed"
);

const onRejectedQueueClient = new QueueClient(
  config.azure.storage.connectionStringItn,
  "on-signature-request-rejected"
);

// ITN is the new primary for validated-documents (all new writes go here).
const validatedContainerClientItn = new ContainerClient(
  config.azure.storage.connectionStringItn,
  "validated-documents"
);

// WEU is kept as the fallback: blobs validated before the migration still live here.
const validatedContainerClient = new ContainerClient(
  config.azure.storage.connectionString,
  "validated-documents"
);

// Reads try ITN first and fall back to WEU; writes always go to ITN.
const validatedContainerClientWithFallback =
  new BaseContainerClientWithFallback(
    validatedContainerClientItn,
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

const pdvTokenizerClient = createPdvTokenizerClient(
  config.pagopa.tokenizer.basePath,
  config.pagopa.tokenizer.apiKey
);

const signerRepository = new PdvTokenizerSignerRepository(pdvTokenizerClient);

const ioApiClient = createIOApiClient(
  config.pagopa.ioServices.basePath,
  config.pagopa.ioServices.subscriptionKey
);

const ioProfileClient = createIoProfileClient(
  config.pagopa.ioProfile.basePath,
  config.pagopa.ioProfile.apiKey
);

const getValidatedEmailByFiscalCode =
  makeGetValidatedEmailByFiscalCode(ioProfileClient);

const lollipopApiClient = createLollipopApiClientExt(
  config.pagopa.lollipop.apiBasePath,
  config.pagopa.lollipop.apiKey
);

const lollipopApiClientInt = createLollipopApiClientInt(
  config.pagopa.lollipopInternal.apiBasePath,
  config.pagopa.lollipopInternal.apiKey
);

const generateSignatureRequestQrCode = makeGenerateSignatureRequestQrCode(
  config.pagopa.ioLink
);

const signatureRequestRepository = new CosmosDbSignatureRequestRepository(
  database
);

const info = InfoFunction({
  namirialConfig: config.namirial,
  pdvTokenizerClient,
  ioApiClient,
  lollipopApiClient,
  db: database,
  filledContainerClient,
  validatedContainerClient,
  signedContainerClient: signedContainerClientItn,
  documentsToFillQueue,
  qtspQueue,
  onWaitForSignatureQueueClient
});

app.http("info", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "info",
  handler: info
});

const getMetadata = GetMetadataFunction({
  ioSignServiceId: config.pagopa.ioSignServiceId
});

app.http("getMetadata", {
  methods: ["GET"],
  authLevel: "function",
  route: "metadata",
  handler: getMetadata
});

const getSignatureRequests = GetSignatureRequestsFunction({
  signatureRequestRepository,
  signerRepository
});

app.http("getSignatureRequests", {
  methods: ["GET"],
  authLevel: "function",
  route: "signature-requests",
  handler: getSignatureRequests
});

const getSignatureRequest = GetSignatureRequestFunction({
  signatureRequestRepository,
  signerRepository,
  validatedContainerClient: validatedContainerClientWithFallback,
  signedContainerClient: signedContainerClientWithFallback
});

app.http("getSignatureRequest", {
  methods: ["GET"],
  authLevel: "function",
  route: "signature-requests/{signatureRequestId}",
  handler: getSignatureRequest
});

const updateSignatureRequest = UpdateSignatureRequestFunction({
  signatureRequestRepository,
  inputDecoder: SignatureRequestCancelled,
  eventAnalyticsClient: eventHubAnalyticsClient
});

app.storageQueue("updateSignatureRequest", {
  queueName: "waiting-for-signature-request-updates",
  connection: "StorageAccountItnConnectionString",
  handler: updateSignatureRequest
});

const createSignature = CreateSignatureFunction({
  signerRepository,
  lollipopApiClient,
  lollipopApiClientInt,
  ioProfileClient,
  db: database,
  qtspQueue,
  validatedContainerClient: validatedContainerClientWithFallback,
  signedContainerClient: signedContainerClientItn,
  qtspConfig: config.namirial
});

app.http("createSignature", {
  methods: ["POST"],
  authLevel: "function",
  route: "signatures",
  handler: createSignature
});

const createSignatureRequest = CreateSignatureRequestFunction({
  db: database,
  onWaitForSignatureQueueClient,
  generateSignatureRequestQrCode,
  inputDecoder: SignatureRequestReady
});

app.storageQueue("createSignatureRequest", {
  queueName: "on-signature-request-ready",
  connection: "StorageAccountItnConnectionString",
  handler: createSignatureRequest
});

const getSignerByFiscalCode = GetSignerByFiscalCodeFunction({
  signerRepository,
  ioApiClient
});

app.http("getSignerByFiscalCode", {
  methods: ["POST"],
  authLevel: "function",
  route: "signers",
  handler: getSignerByFiscalCode
});

const getQtspClausesMetadata = GetQtspClausesMetadataFunction(config.namirial);

app.http("getQtspClausesMetadata", {
  methods: ["GET"],
  authLevel: "function",
  route: "qtsp/clauses",
  handler: getQtspClausesMetadata
});

const createFilledDocument = CreateFilledDocumentFunction({
  filledContainerClient,
  documentsToFillQueue,
  signerRepository,
  getValidatedEmailByFiscalCode
});

app.http("createFilledDocument", {
  methods: ["POST"],
  authLevel: "function",
  route: "qtsp/clauses/filled_document",
  handler: createFilledDocument
});

const getThirdPartyMessageDetails = GetThirdPartyMessageDetailsFunction({
  signerRepository,
  db: database
});

app.http("getThirdPartyMessageDetails", {
  methods: ["GET"],
  authLevel: "function",
  route: "messages/{signatureRequestId}",
  handler: getThirdPartyMessageDetails
});

const getThirdPartyMessageAttachmentContent =
  GetThirdPartyMessageAttachmentContentFunction({
    signerRepository,
    db: database,
    signedContainerClient: signedContainerClientWithFallback
  });

app.http("getThirdPartyMessageAttachmentContent", {
  methods: ["GET"],
  authLevel: "function",
  route: "messages/{signatureRequestId}/{documentId}",
  handler: getThirdPartyMessageAttachmentContent
});

const fillDocument = FillDocumentFunction({
  signerRepository,
  filledContainerClient,
  inputDecoder: FillDocumentPayload
});

app.storageQueue("fillDocument", {
  queueName: "waiting-for-documents-to-fill",
  connection: "StorageAccountItnConnectionString",
  handler: fillDocument
});

const validateSignature = ValidateSignatureFunction({
  db: database,
  signedContainerClient: signedContainerClientItn,
  qtspConfig: config.namirial,
  onSignedQueueClient,
  onRejectedQueueClient,
  eventHubAnalyticsClient,
  inputDecoder: ValidateSignaturePayload
});

app.storageQueue("validateSignature", {
  queueName: "waiting-for-qtsp",
  connection: "StorageAccountItnConnectionString",
  handler: validateSignature
});
