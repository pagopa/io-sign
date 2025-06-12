import { createHandler } from "handler-kit-legacy";
import * as azure from "handler-kit-legacy/lib/azure";

import * as TE from "fp-ts/lib/TaskEither";

import { constVoid, flow, identity, pipe } from "fp-ts/lib/function";

import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { makeGetFiscalCodeBySignerId } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { ContainerClient } from "@azure/storage-blob";

import { makeFetchWithTimeout } from "@io-sign/io-sign/infra/http/fetch-timeout";

import { makeUploadBlob } from "../storage/blob";
import { makeFillDocument } from "../../../app/use-cases/fill-document";
import { FillDocumentPayload } from "../../../filled-document";

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
