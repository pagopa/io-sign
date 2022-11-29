import { ContainerClient } from "@azure/storage-blob";
import { QueueClient } from "@azure/storage-queue";
import { createPdvTokenizerClient } from "@io-sign/io-sign/infra/pdv-tokenizer/client";

import * as E from "fp-ts/lib/Either";
import { identity, pipe } from "fp-ts/lib/function";

import { createIOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import { makeInfoFunction } from "../infra/azure/functions/info";
import { makeCreateFilledDocumentFunction } from "../infra/azure/functions/create-filled-document";
import { makeFillDocumentFunction } from "../infra/azure/functions/fill-document";
import { makeGetSignerByFiscalCodeFunction } from "../infra/azure/functions/get-signer-by-fiscal-code";
import { getConfigFromEnvironment } from "./config";

const configOrError = pipe(
  getConfigFromEnvironment(process.env),
  E.getOrElseW(identity)
);

if (configOrError instanceof Error) {
  throw configOrError;
}

const config = configOrError;

const filledContainerClient = new ContainerClient(
  config.azure.storage.connectionString,
  config.filledModulesStorageContainerName
);

const documentsToFillQueue = new QueueClient(
  config.azure.storage.connectionString,
  config.documentsToFillQueueName
);

const pdvTokenizerClient = createPdvTokenizerClient(
  config.pagopa.tokenizer.basePath,
  config.pagopa.tokenizer.apiKey
);

const ioApiClient = createIOApiClient(
  config.pagopa.ioServices.basePath,
  config.pagopa.ioServices.subscriptionKey
);

export const Info = makeInfoFunction();

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
