import { constVoid, flow, identity, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as t from "io-ts";

import * as azure from "@pagopa/handler-kit/lib/azure";

import { last } from "fp-ts/ReadonlyNonEmptyArray";
import { split } from "fp-ts/string";

import { Database as CosmosDatabase } from "@azure/cosmos";
import { ContainerClient } from "@azure/storage-blob";
import { createHandler } from "@pagopa/handler-kit";

import { validate } from "@io-sign/io-sign/validation";
import { getPdfMetadata } from "@io-sign/io-sign/infra/pdf";

import {
  makeGetUploadMetadata,
  makeUpsertUploadMetadata,
} from "../cosmos/upload";

import { makeValidateUpload } from "../../../app/use-cases/validate-upload";

import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest,
} from "../cosmos/signature-request";

import {
  makeDeleteUploadedMetadata,
  makeDownloadUploadedDocument,
  makeIsUploaded,
  makeMoveUploadedDocument,
} from "../storage/upload";
import {
  GetUploadMetadata,
  UploadMetadata,
  uploadMetadataNotFoundError,
} from "../../../upload";

export const extractFileNameFromURI = flow(split("/"), last);

const makeRequireUploadMetadata =
  (
    getUploadMetadata: GetUploadMetadata
  ): RTE.ReaderTaskEither<
    azure.Blob<Record<string, never>>,
    Error,
    UploadMetadata
  > =>
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
  const upsertUploadMetadata = makeUpsertUploadMetadata(db);

  const isUploaded = makeIsUploaded(uploadedContainerClient);

  const moveUploadedDocument = makeMoveUploadedDocument(
    validatedContainerClient
  );

  const downloadDocumentUploadedFromBlobStorage = makeDownloadUploadedDocument(
    uploadedContainerClient
  );

  const deleteDocumentUploadedFromBlobStorage = makeDeleteUploadedMetadata(
    uploadedContainerClient
  );

  const requireUploadMetadata = makeRequireUploadMetadata(getUploadMetadata);

  const validateUpload = makeValidateUpload(
    getSignatureRequest,
    upsertSignatureRequest,
    isUploaded,
    moveUploadedDocument,
    downloadDocumentUploadedFromBlobStorage,
    deleteDocumentUploadedFromBlobStorage,
    upsertUploadMetadata,
    getPdfMetadata
  );

  const decodeRequest = flow(
    azure.fromBlobStorage(t.type({})),
    TE.fromEither,
    TE.chain(requireUploadMetadata)
  );

  return createHandler(decodeRequest, validateUpload, identity, constVoid);
};

export const makeValidateUploadFunction = (
  database: CosmosDatabase,
  uploadedContainerClient: ContainerClient,
  validatedContainerClient: ContainerClient
) =>
  pipe(
    makeValidateUploadHandler(
      database,
      uploadedContainerClient,
      validatedContainerClient
    ),
    azure.unsafeRun
  );
