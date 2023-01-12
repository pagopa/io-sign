import { ContainerClient } from "@azure/storage-blob";
import { QueueClient } from "@azure/storage-queue";
import { createPdvTokenizerClient } from "@io-sign/io-sign/infra/pdv-tokenizer/client";

import * as E from "fp-ts/lib/Either";
import { identity, pipe } from "fp-ts/lib/function";

import { CosmosClient } from "@azure/cosmos";
import { createIOApiClient } from "@io-sign/io-sign/infra/io-services/client";

import { makeInfoFunction } from "../infra/azure/functions/info";
import { makeCreateFilledDocumentFunction } from "../infra/azure/functions/create-filled-document";
import { makeFillDocumentFunction } from "../infra/azure/functions/fill-document";
import { makeGetSignerByFiscalCodeFunction } from "../infra/azure/functions/get-signer-by-fiscal-code";
import { makeGetQtspClausesMetadataFunction } from "../infra/azure/functions/get-qtsp-clauses-metadata";
import { makeCreateSignatureFunction } from "../infra/azure/functions/create-signature";
import { makeCreateSignatureRequestFunction } from "../infra/azure/functions/create-signature-request";
import { makeGetSignatureRequestFunction } from "../infra/azure/functions/get-signature-request";
import { makeValidateSignatureFunction } from "../infra/azure/functions/validate-signature";
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

export const Info = makeInfoFunction(
  config.namirial,
  pdvTokenizerClient,
  ioApiClient,
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
  database,
  qtspQueue,
  validatedContainerClient,
  signedContainerClient,
  config.namirial,
  config.mock
);

export const CreateSignatureRequest = makeCreateSignatureRequestFunction(
  database,
  onWaitForSignatureQueueClient
);

export const GetSignatureRequest = makeGetSignatureRequestFunction(
  database,
  validatedContainerClient,
  signedContainerClient
);

export const ValidateSignature = makeValidateSignatureFunction(
  ioApiClient,
  pdvTokenizerClient,
  database,
  signedContainerClient,
  config.namirial
);
