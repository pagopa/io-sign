import { constVoid, flow, identity, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import * as t from "io-ts";

import * as azure from "@pagopa/handler-kit/lib/azure";
import {
  GetUploadMetadata,
  UploadMetadata,
  uploadMetadataNotFoundError,
} from "../../../upload";

import { last } from "fp-ts/ReadonlyNonEmptyArray";
import { split } from "fp-ts/string";
import { validate } from "@pagopa/handler-kit/lib/validation";
import { makeGetUploadMetadata } from "../cosmos/upload";

import { Database as CosmosDatabase } from "@azure/cosmos";

import { makeValidateUpload } from "../../../app/use-cases/validate-upload";

import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest,
} from "../cosmos/signature-request";

import { makeIsUploaded, makeMoveUploadedDocument } from "../storage/upload";
import { ContainerClient } from "@azure/storage-blob";
import { createHandler } from "@pagopa/handler-kit";


export const extractFileNameFromURI = flow(split("/"), last);

const makeRequireUploadMetadata =
  (
    getUploadMetadata: GetUploadMetadata
  ): RTE.ReaderTaskEither<azure.Blob<{}>, Error, UploadMetadata> =>
  (blob) =>
    pipe(
      extractFileNameFromURI(blob.uri),
      validate(UploadMetadata.types[0].props.id, "invalid id"),
      TE.fromEither,
      TE.chain(getUploadMetadata),
      TE.chain(TE.fromOption(() => uploadMetadataNotFoundError)),
      TE.map((uploadMetadata) => ({
        ...uploadMetadata,
        url: blob.uri,
      }))
    );

const makeValidateUploadHandler = (
  db: CosmosDatabase,
  uploadedContainerClient: ContainerClient,
  validatedContainerClient: ContainerClient
) => {
  const getUploadMetadata = makeGetUploadMetadata(db);

  const getSignatureRequest = makeGetSignatureRequest(db);
  const upsertSignatureRequest = makeUpsertSignatureRequest(db);
  const isUploaded = makeIsUploaded(uploadedContainerClient);

  const moveUploadedDocument = makeMoveUploadedDocument(
    validatedContainerClient
  );

  const requireUploadMetadata = makeRequireUploadMetadata(getUploadMetadata);

  const validateUpload = makeValidateUpload(
    getSignatureRequest,
    upsertSignatureRequest,
    isUploaded,
    moveUploadedDocument
  );

  const decodeRequest = flow(
    azure.fromBlobStorage(t.type({})),
    TE.fromEither,
    TE.chain(requireUploadMetadata)
  );

  return createHandler(decodeRequest, validateUpload, identity, constVoid);
};

export const makeValidateUploadAzureFunction = (db: CosmosDatabase, uploadedContainerClient: ContainerClient, validatedContainerClient: ContainerClient) => {
  const handler = makeValidateUploadHandler(
    db,
    uploadedContainerClient,
    validatedContainerClient,
  );
  return azure.unsafeRun(handler);
};
