import { Document, DocumentId } from "@io-sign/io-sign/document";
import { Id, id as newId } from "@io-sign/io-sign/id";
import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";
import * as t from "io-ts";

import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import * as R from "fp-ts/lib/Reader";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";

import { pipe, flow, identity } from "fp-ts/lib/function";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { UrlFromString } from "@pagopa/ts-commons/lib/url";
import { Issuer } from "@io-sign/io-sign/issuer";

import {
  getDocument,
  SignatureRequestId,
} from "@io-sign/io-sign/signature-request";

import { getPdfMetadata } from "@io-sign/io-sign/infra/pdf";
import { PdfDocumentMetadata } from "@io-sign/io-sign/document";

import { SignatureRequest } from "./signature-request";

export const UploadMetadata = t.intersection([
  t.type({
    id: Id,
    documentId: DocumentId,
    signatureRequestId: SignatureRequestId,
    issuerId: Issuer.props.id,
    createdAt: IsoDateFromString,
    updatedAt: IsoDateFromString,
    validated: t.boolean,
  }),
  t.partial({
    url: t.string,
  }),
]);

export type UploadMetadata = t.TypeOf<typeof UploadMetadata>;

const documentNotFoundError = new EntityNotFoundError("Document");

export const newUploadMetadata =
  (documentId: Document["id"]) =>
  (
    signatureRequest: SignatureRequest
  ): E.Either<EntityNotFoundError, UploadMetadata> =>
    pipe(
      signatureRequest,
      getDocument(documentId),
      E.fromOption(() => documentNotFoundError),
      E.map((document) => ({
        id: newId(),
        documentId: document.id,
        signatureRequestId: signatureRequest.id,
        issuerId: signatureRequest.issuerId,
        createdAt: new Date(),
        updatedAt: new Date(),
        validated: false,
      }))
    );

export const markUploadMetadataAsValid = (uploadMetadata: UploadMetadata) =>
  pipe({
    ...uploadMetadata,
    validated: true,
    updatedAt: new Date(),
  });

export type InsertUploadMetadata = (
  uploadMetadata: UploadMetadata
) => TE.TaskEither<Error, UploadMetadata>;

export const UploadUrl = UrlFromString;
export type UploadUrl = t.TypeOf<typeof UploadUrl>;

export type GetUploadUrl = (
  uploadMetadata: UploadMetadata
) => TE.TaskEither<Error, UploadUrl>;

export const uploadMetadataNotFoundError = new EntityNotFoundError(
  "UploadMetadata"
);

export type UploadMetadataRepository = {
  get: (
    id: UploadMetadata["id"]
  ) => TE.TaskEither<Error, O.Option<UploadMetadata>>;
  upsert: (meta: UploadMetadata) => TE.TaskEither<Error, UploadMetadata>;
};

type UploadMetadataEnvironment = {
  uploadMetadataRepository: UploadMetadataRepository;
};

export const getUploadMetadata =
  (
    id: UploadMetadata["id"]
  ): RTE.ReaderTaskEither<UploadMetadataEnvironment, Error, UploadMetadata> =>
  ({ uploadMetadataRepository: repo }) =>
    pipe(repo.get(id), TE.chain(TE.fromOption(() => new Error("..."))));

export const upsertUploadMetadata =
  (
    meta: UploadMetadata
  ): RTE.ReaderTaskEither<UploadMetadataEnvironment, Error, UploadMetadata> =>
  ({ uploadMetadataRepository: repo }) =>
    repo.upsert(meta);

export type FileStorage = {
  exists: (filename: string) => TE.TaskEither<Error, boolean>;
  download: (filename: string) => TE.TaskEither<Error, Buffer>;
  createFromUrl: (
    url: string,
    filename: string
  ) => TE.TaskEither<Error, string>;
  remove: (filename: string) => TE.TaskEither<Error, void>;
  getUrl: (filename: string) => string;
};

export const getMetadataFromUploadedDocument =
  (
    filename: string
  ): RTE.ReaderTaskEither<
    { uploadedFileStorage: FileStorage },
    Error,
    PdfDocumentMetadata
  > =>
  ({ uploadedFileStorage }) =>
    pipe(
      TE.right(filename),
      TE.chainFirst(
        flow(
          uploadedFileStorage.exists,
          TE.filterOrElse(
            identity,
            () =>
              new Error(
                "the file referenced by the upload metadata does not exist"
              )
          )
        )
      ),
      TE.chain(uploadedFileStorage.download),
      TE.chain(getPdfMetadata)
    );

export const removeDocumentFromStorage =
  (
    filename: string
  ): RTE.ReaderTaskEither<{ uploadedFileStorage: FileStorage }, Error, void> =>
  ({ uploadedFileStorage: storage }) =>
    storage.remove(filename);

export const createDocumentFromUrl =
  (filename: string) =>
  (
    url: string
  ): RTE.ReaderTaskEither<
    { validatedFileStorage: FileStorage },
    Error,
    string
  > =>
  ({ validatedFileStorage: storage }) =>
    storage.createFromUrl(url, filename);

export const getUploadedDocumentUrl =
  (uploadId: string): R.Reader<{ uploadedFileStorage: FileStorage }, string> =>
  ({ uploadedFileStorage: storage }) =>
    storage.getUrl(uploadId);
