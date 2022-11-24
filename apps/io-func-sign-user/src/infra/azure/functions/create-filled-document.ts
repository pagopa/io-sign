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
import {
  CreateFilledDocumentPayload,
  makeCreateFilledDocument,
} from "../../../app/use-cases/create-filled-document";
import { makeRequireSigner } from "../../http/decoder/signer";
import { CreateFilledDocumentBody } from "../../http/models/CreateFilledDocumentBody";
import { FilledDocumentToApiModel } from "../../http/encoder/filled-document";
import { FilledDocumentDetailView } from "../../http/models/FilledDocumentDetailView";

import { getConfigFromEnvironment } from "../../../app/config";
import { makeUploadFilledDocument } from "../storage/filled-document";

/* TODO: This function will have to be asynchronous.
 * Refer to the Design Review
 */
const makeCreateFilledDocumentHandler = (
  tokenizer: PdvTokenizerClientWithApiKey,
  filledContainerClient: ContainerClient
) => {
  const getFiscalCodeBySignerId = makeGetFiscalCodeBySignerId(tokenizer);
  const uploadFilledDocument = makeUploadFilledDocument(filledContainerClient);

  const createFilledDocument = makeCreateFilledDocument(
    getFiscalCodeBySignerId,
    uploadFilledDocument
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
    createFilledDocument,
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
  config.filledStorageContainerName
);

export const run = pipe(
  makeCreateFilledDocumentHandler(pdvTokenizerClient, filledContainerClient),
  azure.unsafeRun
);
