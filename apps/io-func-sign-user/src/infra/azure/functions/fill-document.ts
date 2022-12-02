import { createHandler } from "@pagopa/handler-kit";
import * as azure from "@pagopa/handler-kit/lib/azure";

import * as TE from "fp-ts/lib/TaskEither";

import { pipe, flow, identity, constVoid } from "fp-ts/lib/function";

import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { makeGetFiscalCodeBySignerId } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { ContainerClient } from "@azure/storage-blob";

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

export const makeFillDocumentFunction = (
  pdvTokenizerClient: PdvTokenizerClientWithApiKey,
  filledContainerClient: ContainerClient
) =>
  pipe(
    makeFillDocumentHandler(
      pdvTokenizerClient,
      filledContainerClient,
      makeFetchWithTimeout()
    ),
    azure.unsafeRun
  );
