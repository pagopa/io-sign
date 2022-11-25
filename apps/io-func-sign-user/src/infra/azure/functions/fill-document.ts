import { createHandler } from "@pagopa/handler-kit";
import * as azure from "@pagopa/handler-kit/lib/azure";

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import { pipe, flow, identity, constVoid } from "fp-ts/lib/function";

import {
  createPdvTokenizerClient,
  PdvTokenizerClientWithApiKey,
} from "@internal/pdv-tokenizer/client";
import { makeGetFiscalCodeBySignerId } from "@internal/pdv-tokenizer/signer";
import { ContainerClient } from "@azure/storage-blob";

import { getConfigFromEnvironment } from "../../../app/config";

import { makeFetchWithTimeout } from "../../http/fetch-timeout";

import { makeUploadBlob } from "../storage/blob";
import {
  FillDocumentPayload,
  makeFillDocument,
} from "../../../app/use-cases/fill-document";

const makeFillDocumentHandler = (
  tokenizer: PdvTokenizerClientWithApiKey,
  filledContainerClient: ContainerClient,
  fetchWithTimeout: typeof fetch
) => {
  const getFiscalCodeBySignerId = makeGetFiscalCodeBySignerId(tokenizer);
  const uploadFilledDocument = makeUploadBlob(filledContainerClient);

  const fillDocument = makeFillDocument(
    getFiscalCodeBySignerId,
    uploadFilledDocument,
    fetchWithTimeout
  );

  const decodeQueueMessage = flow(
    azure.fromQueueMessage(FillDocumentPayload),
    TE.fromEither
  );

  return createHandler(decodeQueueMessage, fillDocument, identity, constVoid);
};

const configOrError = pipe(
  getConfigFromEnvironment(process.env),
  E.getOrElseW(identity)
);

if (configOrError instanceof Error) {
  throw configOrError;
}

const config = configOrError;

const pdvTokenizerClient = createPdvTokenizerClient(
  config.pagopa.tokenizer.basePath,
  config.pagopa.tokenizer.apiKey
);

const filledContainerClient = new ContainerClient(
  config.azure.storage.connectionString,
  config.filledModulesStorageContainerName
);

const fetchWithTimeout = makeFetchWithTimeout();

export const run = pipe(
  makeFillDocumentHandler(
    pdvTokenizerClient,
    filledContainerClient,
    fetchWithTimeout
  ),
  azure.unsafeRun
);
