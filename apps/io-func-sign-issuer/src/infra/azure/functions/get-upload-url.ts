import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import * as azure from "@pagopa/handler-kit/lib/azure";

import { flow, pipe } from "fp-ts/lib/function";
import { HttpRequest, path } from "@pagopa/handler-kit/lib/http";
import { sequenceS } from "fp-ts/lib/Apply";
import { Document } from "@io-sign/io-sign/document";
import { createHandler } from "@pagopa/handler-kit";
import { Database as CosmosDatabase } from "@azure/cosmos";
import { ContainerClient } from "@azure/storage-blob";
import { validate } from "@io-sign/io-sign/validation";
import { error, success } from "@io-sign/io-sign/infra/http/response";
import { UploadUrl } from "../../http/models/UploadUrl";
import { mockGetIssuerBySubscriptionId } from "../../__mocks__/issuer";

import { makeGetSignatureRequest } from "../cosmos/signature-request";

import { makeGetUploadUrl } from "../../azure/storage/upload";

import {
  makeGetUploadUrl as makeGetUploadUrlUseCase,
  GetUploadUrlPayload,
} from "../../../app/use-cases/get-upload-url";

import { UploadUrlToApiModel } from "../../http/encoders/upload";
import { makeRequireSignatureRequest } from "../../http/decoders/signature-request";
import { makeInsertUploadMetadata } from "../cosmos/upload";

const makeGetUploadUrlHandler = (
  db: CosmosDatabase,
  containerClient: ContainerClient
) => {
  const getSignatureRequest = makeGetSignatureRequest(db);
  const insertUploadMetadata = makeInsertUploadMetadata(db);

  const getUploadUrlFromBlobStorage = makeGetUploadUrl(containerClient);

  const requireSignatureRequest = makeRequireSignatureRequest(
    mockGetIssuerBySubscriptionId,
    getSignatureRequest
  );

  const getUploadUrl = makeGetUploadUrlUseCase(
    insertUploadMetadata,
    getUploadUrlFromBlobStorage
  );

  const requireDocumentIdFromPath = flow(
    path("documentId"),
    E.fromOption(() => new Error(`missing "id" in path`)),
    E.chainW(validate(Document.types[0].props.id, `invalid "id" supplied`))
  );

  const requireGetUploadUrlPayload: RTE.ReaderTaskEither<
    HttpRequest,
    Error,
    GetUploadUrlPayload
  > = sequenceS(RTE.ApplyPar)({
    signatureRequest: requireSignatureRequest,
    documentId: RTE.fromReaderEither(requireDocumentIdFromPath),
  });

  const decodeHttpRequest = flow(
    azure.fromHttpRequest,
    TE.fromEither,
    TE.chain(requireGetUploadUrlPayload)
  );

  return createHandler(
    decodeHttpRequest,
    getUploadUrl,
    error,
    flow(UploadUrlToApiModel.encode, success(UploadUrl))
  );
};

export const makeGetUploadUrlFunction = (
  database: CosmosDatabase,
  uploadedContainerClient: ContainerClient
) =>
  pipe(
    makeGetUploadUrlHandler(database, uploadedContainerClient),
    azure.unsafeRun
  );
