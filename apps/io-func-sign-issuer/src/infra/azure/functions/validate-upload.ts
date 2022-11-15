import { constVoid, flow, identity, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import * as t from "io-ts";

import * as azure from "@pagopa/handler-kit/lib/azure";

import { last } from "fp-ts/ReadonlyNonEmptyArray";
import { split } from "fp-ts/string";

import { CosmosClient, Database as CosmosDatabase } from "@azure/cosmos";
import { ContainerClient } from "@azure/storage-blob";
import { createHandler } from "@pagopa/handler-kit";
import { makeGetUploadMetadata } from "../cosmos/upload";

import * as E from "fp-ts/lib/Either";

import { getConfigFromEnvironment } from "../../../app/config";

import { makeValidateUpload } from "../../../app/use-cases/validate-upload";

import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest,
} from "../cosmos/signature-request";

import { makeIsUploaded, makeMoveUploadedDocument } from "../storage/upload";
import {
  GetUploadMetadata,
  UploadMetadata,
  uploadMetadataNotFoundError,
} from "../../../upload";

import { validate } from "@internal/io-sign/validation";

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

const configOrError = pipe(
  getConfigFromEnvironment(process.env),
  E.getOrElseW(identity)
);

if (configOrError instanceof Error) {
  throw configOrError;
}

const config = configOrError;

const cosmosClient = new CosmosClient(config.azure.cosmos.connectionString);
const database = cosmosClient.database(config.azure.cosmos.dbName);

const uploadedContainerClient = new ContainerClient(
  config.azure.storage.connectionString,
  config.uploadedStorageContainerName
);

const validatedContainerClient = new ContainerClient(
  config.azure.storage.connectionString,
  config.validatedStorageContainerName
);

export const run = pipe(
  makeValidateUploadHandler(
    database,
    uploadedContainerClient,
    validatedContainerClient
  ),
  azure.unsafeRun
);
