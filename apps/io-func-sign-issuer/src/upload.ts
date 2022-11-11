import { Document } from "@internal/io-sign/document";
import { Id, id as newId } from "@internal/io-sign/id";
import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";
import * as t from "io-ts";

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";

import { pipe } from "fp-ts/lib/function";
import { EntityNotFoundError } from "@internal/io-sign/error";
import { UrlFromString } from "@pagopa/ts-commons/lib/url";
import { getDocument, SignatureRequest } from "./signature-request";

export const UploadMetadata = t.intersection([
  t.type({
    id: Id,
    documentId: Id,
    signatureRequestId: Id,
    issuerId: Id,
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

export type InsertUploadMetadata = (
  uploadMetadata: UploadMetadata
) => TE.TaskEither<Error, UploadMetadata>;

export type GetUploadMetadata = (
  id: UploadMetadata["id"]
) => TE.TaskEither<Error, O.Option<UploadMetadata>>;

export const UploadUrl = UrlFromString;
export type UploadUrl = t.TypeOf<typeof UploadUrl>;

export type GetUploadUrl = (
  uploadMetadata: UploadMetadata
) => TE.TaskEither<Error, UploadUrl>;

export const uploadMetadataNotFoundError = new EntityNotFoundError(
  "UploadMetadata"
);

export type IsUploaded = (
  id: UploadMetadata["id"]
) => TE.TaskEither<Error, boolean>;

export type MoveUploadedDocument = (
  destination: UploadMetadata["documentId"]
) => (source: string) => TE.TaskEither<Error, string>;

export type DeleteUploadMetadata = (
  documentId: UploadMetadata["documentId"]
) => TE.TaskEither<Error, string>;
