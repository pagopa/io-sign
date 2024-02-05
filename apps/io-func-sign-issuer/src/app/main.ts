import { CosmosClient } from "@azure/cosmos";
import { ContainerClient } from "@azure/storage-blob";
import { QueueClient } from "@azure/storage-queue";
import {
  EventHubConsumerClient,
  EventHubProducerClient,
} from "@azure/event-hubs";

import { createIOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import { createPdvTokenizerClient } from "@io-sign/io-sign/infra/pdv-tokenizer/client";

import * as E from "fp-ts/lib/Either";
import { pipe, identity } from "fp-ts/lib/function";

import * as t from "io-ts";
import { makeGetSignerFunction } from "../infra/azure/functions/get-signer";
import { makeGetUploadUrlFunction } from "../infra/azure/functions/get-upload-url";
import { makeInfoFunction } from "../infra/azure/functions/info";
import { makeSendNotificationFunction } from "../infra/azure/functions/send-notification";

import { makeRequestAsWaitForSignatureFunction } from "../infra/azure/functions/mark-as-wait-for-signature";
import { makeRequestAsRejectedFunction } from "../infra/azure/functions/mark-as-rejected";
import { makeRequestAsSignedFunction } from "../infra/azure/functions/mark-as-signed";

import { makeCreateIssuerFunction } from "../infra/azure/functions/create-issuer";
export { run as CreateIssuerByVatNumberView } from "../infra/azure/functions/create-issuers-by-vat-number-view";

import { GetDossierFunction } from "../infra/azure/functions/get-dossier";
import { BackOfficeIssuerRepository } from "../infra/back-office/issuer";
import { CosmosDbDossierRepository } from "../infra/azure/cosmos/dossier";
import { CreateDossierFunction } from "../infra/azure/functions/create-dossier";
import { GetRequestsByDossierFunction } from "../infra/azure/functions/get-requests-by-dossier";
import { GetSignatureRequestFunction } from "../infra/azure/functions/get-signature-request";
import { CosmosDbSignatureRequestRepository } from "../infra/azure/cosmos/signature-request";
import { ValidateUploadFunction } from "../infra/azure/functions/validate-upload";
import { CosmosDbUploadMetadataRepository } from "../infra/azure/cosmos/upload";

import { BlobStorageFileStorage } from "../infra/azure/storage/upload";
import { CreateSignatureRequestFunction } from "../infra/azure/functions/create-signature-request";
import { SetSignatureRequestStatusFunction } from "../infra/azure/functions/set-signature-request-status";
import { validateDocumentFunction } from "../infra/azure/functions/validate-document";
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

const uploadedContainerClient = new ContainerClient(
  config.azure.storage.connectionString,
  "uploaded-documents"
);

const validatedContainerClient = new ContainerClient(
  config.azure.storage.connectionString,
  "validated-documents"
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

export const Info = makeInfoFunction(
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

export const MarkAsWaitForSignature =
  makeRequestAsWaitForSignatureFunction(database);

export const MarkAsRejected = makeRequestAsRejectedFunction(
  database,
  pdvTokenizerClientWithApiKey,
  ioApiClient,
  config.pagopa.ioServices.configurationId,
  eventAnalyticsClient
);

export const MarkAsSigned = makeRequestAsSignedFunction(
  database,
  pdvTokenizerClientWithApiKey,
  ioApiClient,
  config.pagopa.ioServices.configurationId,
  eventHubBillingClient,
  eventAnalyticsClient
);

export const GetSignerByFiscalCode = makeGetSignerFunction(
  pdvTokenizerClientWithApiKey,
  ioApiClient
);

export const GetUploadUrl = makeGetUploadUrlFunction(
  database,
  uploadedContainerClient
);

export const SendNotification = makeSendNotificationFunction(
  database,
  pdvTokenizerClientWithApiKey,
  ioApiClient,
  config.pagopa.ioServices.configurationId,
  eventAnalyticsClient
);

export const CreateIssuer = makeCreateIssuerFunction(
  database,
  config.pagopa.selfCare,
  config.slack
);

const issuerRepository = new BackOfficeIssuerRepository(
  config.backOffice.basePath,
  config.backOffice.apiKey
);
const dossierRepository = new CosmosDbDossierRepository(database);
const uploadMetadataRepository = new CosmosDbUploadMetadataRepository(database);
const signatureRequestRepository = new CosmosDbSignatureRequestRepository(
  database.container("signature-requests")
);

const uploadedFileStorage = new BlobStorageFileStorage(uploadedContainerClient);

const validatedFileStorage = new BlobStorageFileStorage(
  validatedContainerClient
);

export const GetDossier = GetDossierFunction({
  issuerRepository,
  dossierRepository,
});

export const CreateDossier = CreateDossierFunction({
  issuerRepository,
  dossierRepository,
});

export const GetRequestsByDossier = GetRequestsByDossierFunction({
  signatureRequestRepository,
  issuerRepository,
  dossierRepository,
});

export const ValidateUpload = ValidateUploadFunction({
  signatureRequestRepository,
  uploadMetadataRepository,
  uploadedFileStorage,
  validatedFileStorage,
  inputDecoder: t.type({ uri: t.string }),
  eventAnalyticsClient,
});

export const ValidateDocument = validateDocumentFunction({
  issuerRepository,
});

export const GetSignatureRequest = GetSignatureRequestFunction({
  issuerRepository,
  signatureRequestRepository,
  signedContainerClient,
});

export const CreateSignatureRequest = CreateSignatureRequestFunction({
  issuerRepository,
  dossierRepository,
  signatureRequestRepository,
  eventAnalyticsClient,
});

export const SetSignatureRequestStatus = SetSignatureRequestStatusFunction({
  issuerRepository,
  signatureRequestRepository,
  eventAnalyticsClient,
  ready: onSignatureRequestReadyQueueClient,
  updated: WaitingForSignatureRequestUpdatesQueueClient,
});
