import { createHandler } from "@pagopa/handler-kit";
import * as azure from "@pagopa/handler-kit/lib/azure";

import { created, error } from "@internal/io-sign/infra/http/response";

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { pipe, flow } from "fp-ts/lib/function";
import { HttpRequest } from "@pagopa/handler-kit/lib/http";

import { sequenceS } from "fp-ts/lib/Apply";
import { validate } from "@internal/io-sign/validation";

import { ContainerClient } from "@azure/storage-blob";

import { QueueClient } from "@azure/storage-queue";
import { makeGetFiscalCodeBySignerId } from "@internal/pdv-tokenizer/signer";
import { PdvTokenizerClientWithApiKey } from "@internal/pdv-tokenizer/client";
import {
  CreateFilledDocumentPayload,
  makeCreateFilledDocumentUrl,
} from "../../../app/use-cases/create-filled-document";
import { makeRequireSigner } from "../../http/decoder/signer";
import { CreateFilledDocumentBody } from "../../http/models/CreateFilledDocumentBody";
import { FilledDocumentToApiModel } from "../../http/encoder/filled-document";
import { FilledDocumentDetailView } from "../../http/models/FilledDocumentDetailView";

import { makeGetBlobUrl } from "../storage/blob";
import { makeEnqueueMessage } from "../storage/queue";

const makeCreateFilledDocumentHandler = (
  filledContainerClient: ContainerClient,
  documentsToFillQueue: QueueClient,
  tokenizer: PdvTokenizerClientWithApiKey
) => {
  const getFilledDocumentUrl = makeGetBlobUrl(filledContainerClient);
  const enqueueDocumentToFill = makeEnqueueMessage(documentsToFillQueue);
  const getFiscalCodeBySignerId = makeGetFiscalCodeBySignerId(tokenizer);

  const createFilledDocumentUrl = makeCreateFilledDocumentUrl(
    getFilledDocumentUrl,
    enqueueDocumentToFill,
    getFiscalCodeBySignerId
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
    CreateFilledDocumentPayload
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
    createFilledDocumentUrl,
    error,
    encodeHttpSuccessResponse
  );
};

export const makeCreateFilledDocumentFunction = (
  filledContainerClient: ContainerClient,
  documentsToFillQueue: QueueClient,
  pdvTokenizerClient: PdvTokenizerClientWithApiKey
) =>
  pipe(
    makeCreateFilledDocumentHandler(
      filledContainerClient,
      documentsToFillQueue,
      pdvTokenizerClient
    ),
    azure.unsafeRun
  );
