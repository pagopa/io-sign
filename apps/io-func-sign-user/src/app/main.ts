import { ContainerClient } from "@azure/storage-blob";
import { QueueClient } from "@azure/storage-queue";
import { createPdvTokenizerClient } from "@io-sign/io-sign/infra/pdv-tokenizer/client";

import * as E from "fp-ts/lib/Either";
import { identity, pipe } from "fp-ts/lib/function";

import { CosmosClient } from "@azure/cosmos";
import { createIOApiClient } from "@io-sign/io-sign/infra/io-services/client";

import { makeGenerateSignatureRequestQrCode } from "@io-sign/io-sign/infra/io-link/qr-code";
import { EventHubProducerClient } from "@azure/event-hubs";
import { SignatureRequestCancelled } from "@io-sign/io-sign/signature-request";
import { makeInfoFunction } from "../infra/azure/functions/info";
import { makeCreateFilledDocumentFunction } from "../infra/azure/functions/create-filled-document";
import { makeFillDocumentFunction } from "../infra/azure/functions/fill-document";
import { makeGetSignerByFiscalCodeFunction } from "../infra/azure/functions/get-signer-by-fiscal-code";
import { makeGetQtspClausesMetadataFunction } from "../infra/azure/functions/get-qtsp-clauses-metadata";
import { makeCreateSignatureFunction } from "../infra/azure/functions/create-signature";
import { makeCreateSignatureRequestFunction } from "../infra/azure/functions/create-signature-request";
import { makeValidateSignatureFunction } from "../infra/azure/functions/validate-signature";
import { makeGetThirdPartyMessageDetailsFunction } from "../infra/azure/functions/get-third-party-message-details";
import { makeGetThirdPartyMessageAttachmentContentFunction } from "../infra/azure/functions/get-third-party-message-attachments-content";
import { createLollipopApiClient } from "../infra/lollipop/client";
import { GetSignatureRequestsFunction } from "../infra/azure/functions/get-signature-requests";
import { CosmosDbSignatureRequestRepository } from "../infra/azure/cosmos/signature-request";
import { GetSignatureRequestFunction } from "../infra/azure/functions/get-signature-request";
import { UpdateSignatureRequestFunction } from "../infra/azure/functions/update-signature-request";
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

const eventHubAnalyticsClient = new EventHubProducerClient(
  config.azure.eventHubs.analyticsConnectionString,
  "analytics"
);

const filledContainerClient = new ContainerClient(
  config.azure.storage.connectionString,
  "filled-modules"
);

const documentsToFillQueue = new QueueClient(
  config.azure.storage.connectionString,
  "waiting-for-documents-to-fill"
);

const qtspQueue = new QueueClient(
  config.azure.storage.connectionString,
  "waiting-for-qtsp"
);

const onWaitForSignatureQueueClient = new QueueClient(
  config.azure.storage.connectionString,
  "on-signature-request-wait-for-signature"
);

const onSignedQueueClient = new QueueClient(
  config.azure.storage.connectionString,
  "on-signature-request-signed"
);

const onRejectedQueueClient = new QueueClient(
  config.azure.storage.connectionString,
  "on-signature-request-rejected"
);

const validatedContainerClient = new ContainerClient(
  config.azure.storage.connectionString,
  "validated-documents"
);

const signedContainerClient = new ContainerClient(
  config.azure.storage.connectionString,
  "signed-documents"
);

const pdvTokenizerClient = createPdvTokenizerClient(
  config.pagopa.tokenizer.basePath,
  config.pagopa.tokenizer.apiKey
);

const ioApiClient = createIOApiClient(
  config.pagopa.ioServices.basePath,
  config.pagopa.ioServices.subscriptionKey
);

const lollipopApiClient = createLollipopApiClient(
  config.pagopa.lollipop.apiBasePath,
  config.pagopa.lollipop.apiKey
);

const generateSignatureRequestQrCode = makeGenerateSignatureRequestQrCode(
  config.pagopa.ioLink
);

export const Info = makeInfoFunction(
  config.namirial,
  pdvTokenizerClient,
  ioApiClient,
  lollipopApiClient,
  database,
  filledContainerClient,
  validatedContainerClient,
  signedContainerClient,
  documentsToFillQueue,
  qtspQueue,
  onWaitForSignatureQueueClient
);

export const CreateFilledDocument = makeCreateFilledDocumentFunction(
  filledContainerClient,
  documentsToFillQueue,
  pdvTokenizerClient
);

export const FillDocument = makeFillDocumentFunction(
  pdvTokenizerClient,
  filledContainerClient
);

export const GetSignerByFiscalCode = makeGetSignerByFiscalCodeFunction(
  pdvTokenizerClient,
  ioApiClient
);

export const GetQtspClausesMetadata = makeGetQtspClausesMetadataFunction(
  config.namirial
);

export const CreateSignature = makeCreateSignatureFunction(
  pdvTokenizerClient,
  lollipopApiClient,
  database,
  qtspQueue,
  validatedContainerClient,
  signedContainerClient,
  config.namirial
);

export const CreateSignatureRequest = makeCreateSignatureRequestFunction(
  database,
  onWaitForSignatureQueueClient,
  generateSignatureRequestQrCode
);

export const ValidateSignature = makeValidateSignatureFunction(
  database,
  signedContainerClient,
  config.namirial,
  onSignedQueueClient,
  onRejectedQueueClient,
  eventHubAnalyticsClient
);

export const GetThirdPartyMessageDetails =
  makeGetThirdPartyMessageDetailsFunction(pdvTokenizerClient, database);

export const GetThirdPartyMessageAttachmentContent =
  makeGetThirdPartyMessageAttachmentContentFunction(
    pdvTokenizerClient,
    database,
    signedContainerClient
  );

const signatureRequestRepository = new CosmosDbSignatureRequestRepository(
  database
);

export const GetSignatureRequests = GetSignatureRequestsFunction({
  signatureRequestRepository,
});

export const GetSignatureRequest = GetSignatureRequestFunction({
  signatureRequestRepository,
  validatedContainerClient,
  signedContainerClient,
});

export const UpdateSignatureRequest = UpdateSignatureRequestFunction({
  signatureRequestRepository,
  inputDecoder: SignatureRequestCancelled,
});
