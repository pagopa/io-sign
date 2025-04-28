import { Database as CosmosDatabase } from "@azure/cosmos";
import { ContainerClient } from "@azure/storage-blob";
import { DocumentId } from "@io-sign/io-sign/document";
import { error, success } from "@io-sign/io-sign/infra/http/response";
import { validate } from "@io-sign/io-sign/validation";
import { sequenceS } from "fp-ts/lib/Apply";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { flow } from "fp-ts/lib/function";
import { createHandler } from "handler-kit-legacy";
import * as azure from "handler-kit-legacy/lib/azure";
import { HttpRequest, path } from "handler-kit-legacy/lib/http";

import {
  GetUploadUrlPayload,
  makeGetUploadUrl as makeGetUploadUrlUseCase
} from "../../../app/use-cases/get-upload-url";
import { makeGetUploadUrl } from "../../azure/storage/upload";
import { makeGetIssuerBySubscriptionId } from "../../back-office/issuer";
import { makeRequireSignatureRequest } from "../../http/decoders/signature-request";
import { UploadUrlToApiModel } from "../../http/encoders/upload";
import { UploadUrl } from "../../http/models/UploadUrl";
import { makeGetSignatureRequest } from "../cosmos/signature-request";
import { makeInsertUploadMetadata } from "../cosmos/upload";

const makeGetUploadUrlHandler = (
  db: CosmosDatabase,
  containerClient: ContainerClient
) => {
  const getSignatureRequest = makeGetSignatureRequest(db);
  const insertUploadMetadata = makeInsertUploadMetadata(db);
  const getIssuerBySubscriptionId = makeGetIssuerBySubscriptionId(db);

  const getUploadUrlFromBlobStorage = makeGetUploadUrl(containerClient);

  const requireSignatureRequest = makeRequireSignatureRequest(
    getIssuerBySubscriptionId,
    getSignatureRequest
  );

  const getUploadUrl = makeGetUploadUrlUseCase(
    insertUploadMetadata,
    getUploadUrlFromBlobStorage
  );

  const requireDocumentIdFromPath = flow(
    path("documentId"),
    E.fromOption(() => new Error(`missing "id" in path`)),
    E.chainW(validate(DocumentId, `invalid "id" supplied`))
  );

  const requireGetUploadUrlPayload: RTE.ReaderTaskEither<
    HttpRequest,
    Error,
    GetUploadUrlPayload
  > = sequenceS(RTE.ApplyPar)({
    signatureRequest: requireSignatureRequest,
    documentId: RTE.fromReaderEither(requireDocumentIdFromPath)
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

export const makeGetUploadUrlFunction = flow(
  makeGetUploadUrlHandler,
  azure.unsafeRun
);
