import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import * as azure from "@pagopa/handler-kit/lib/azure";

import { makeRequireSignatureRequest } from "../../http/decoders/signature-request";

import {
  makeGetUploadUrl as makeGetUploadUrlUseCase,
  GetUploadUrlPayload,
} from "../../../app/use-cases/get-upload-url";

import { flow } from "fp-ts/lib/function";
import {
  error,
  HttpRequest,
  path,
  success,
} from "@pagopa/handler-kit/lib/http";
import { sequenceS } from "fp-ts/lib/Apply";
import { validate } from "@pagopa/handler-kit/lib/validation";
import { Document } from "@internal/io-sign/document";
import { createHandler } from "@pagopa/handler-kit";
import { UploadUrlToApiModel } from "../../http/encoders/upload";
import { UploadUrl } from "../../http/models/UploadUrl";
import { AzureFunction } from "@azure/functions";
import { mockGetIssuerBySubscriptionId } from "../../__mocks__/issuer";

import { Database as CosmosDatabase } from "@azure/cosmos";
import { makeGetSignatureRequest } from "../cosmos/signature-request";

import { makeGetUploadUrl } from "../../azure/storage/upload";
import { ContainerClient } from "@azure/storage-blob";
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

export const makeGetUploadUrlAzureFunction = (
  db: CosmosDatabase,
  uploadedContainerClient: ContainerClient
) => {
  const handler = makeGetUploadUrlHandler(db, uploadedContainerClient);
  return azure.unsafeRun(handler);
}
