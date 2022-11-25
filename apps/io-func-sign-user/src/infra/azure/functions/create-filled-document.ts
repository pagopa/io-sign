import { createHandler } from "@pagopa/handler-kit";
import * as azure from "@pagopa/handler-kit/lib/azure";

import { created, error } from "@internal/io-sign/infra/http/response";

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { pipe, flow, identity } from "fp-ts/lib/function";
import { HttpRequest } from "@pagopa/handler-kit/lib/http";

import { sequenceS } from "fp-ts/lib/Apply";
import { validate } from "@internal/io-sign/validation";
import {
  createPdvTokenizerClient,
  PdvTokenizerClientWithApiKey,
} from "@internal/pdv-tokenizer/client";
import { makeGetFiscalCodeBySignerId } from "@internal/pdv-tokenizer/signer";
import { ContainerClient } from "@azure/storage-blob";

import { QueueClient } from "@azure/storage-queue";
import {
  makeCreateFilledDocument,
  makePrepareFilledDocument,
  PrepareFilledDocumentPayload,
} from "../../../app/use-cases/create-filled-document";
import { makeRequireSigner } from "../../http/decoder/signer";
import { CreateFilledDocumentBody } from "../../http/models/CreateFilledDocumentBody";
import { FilledDocumentToApiModel } from "../../http/encoder/filled-document";
import { FilledDocumentDetailView } from "../../http/models/FilledDocumentDetailView";

import { getConfigFromEnvironment } from "../../../app/config";

import { makeFetchWithTimeout } from "../../http/fetch-timeout";

import { makeGetBlobUrl, makeUploadBlob } from "../storage/blob";
import { makeEnqueueMessage } from "../storage/queue";

const makeCreateFilledDocumentHandler = (
  tokenizer: PdvTokenizerClientWithApiKey,
  filledContainerClient: ContainerClient,
  fetchWithTimeout: typeof fetch,
  fillingModulesQueue: QueueClient
) => {
  const getFiscalCodeBySignerId = makeGetFiscalCodeBySignerId(tokenizer);
  const uploadBlob = makeUploadBlob(filledContainerClient);
  const getBlobUrl = makeGetBlobUrl(filledContainerClient);
  const enqueueMessage = makeEnqueueMessage(fillingModulesQueue);

  const prepareFilledDocument = makePrepareFilledDocument(
    getBlobUrl,
    enqueueMessage
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createFilledDocument = makeCreateFilledDocument(
    getFiscalCodeBySignerId,
    uploadBlob,
    fetchWithTimeout
  );

  const requireCreateFilledDocumentBody = flow(
    (req: HttpRequest) => req.body,
    validate(CreateFilledDocumentBody),
    E.map((body) => ({
      documentUrl: body.document_url,
      email: body.email,
      familyName: body.family_name,
      name: body.name,
    }))
  );

  const requireCreateFilledDocumentPayload: RTE.ReaderTaskEither<
    HttpRequest,
    Error,
    PrepareFilledDocumentPayload
  > = pipe(
    sequenceS(RTE.ApplyPar)({
      signer: RTE.fromReaderEither(makeRequireSigner),
      body: RTE.fromReaderEither(requireCreateFilledDocumentBody),
    }),
    RTE.map(({ signer, body: { documentUrl, email, familyName, name } }) => ({
      signer,
      documentUrl,
      email,
      familyName,
      name,
    }))
  );

  const decodeHttpRequest = flow(
    azure.fromHttpRequest,
    TE.fromEither,
    TE.chain(requireCreateFilledDocumentPayload)
  );

  const encodeHttpSuccessResponse = flow(
    FilledDocumentToApiModel.encode,
    created(FilledDocumentDetailView)
  );

  return createHandler(
    decodeHttpRequest,
    prepareFilledDocument,
    error,
    encodeHttpSuccessResponse
  );
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

const fillingModulesQueue = new QueueClient(
  config.azure.storage.connectionString,
  config.fillingModulesQueueName
);

const fetchWithTimeout = makeFetchWithTimeout();

export const run = pipe(
  makeCreateFilledDocumentHandler(
    pdvTokenizerClient,
    filledContainerClient,
    fetchWithTimeout,
    fillingModulesQueue
  ),
  azure.unsafeRun
);
