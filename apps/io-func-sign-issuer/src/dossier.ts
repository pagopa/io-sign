import * as t from "io-ts";
import * as tx from "io-ts-types";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { NonEmptyArray } from "fp-ts/lib/NonEmptyArray";

import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";

import { Id, id as newId } from "@internal/io-sign/id";
import { DocumentMetadata } from "@internal/io-sign/document";

import { EntityNotFoundError } from "@internal/io-sign/error";
import { Issuer } from "./issuer";

export const DocumentsMetadata = tx.nonEmptyArray(DocumentMetadata);

export const Dossier = t.type({
  id: Id,
  issuerId: Issuer.props.id,
  documentsMetadata: DocumentsMetadata,
  createdAt: IsoDateFromString,
  updatedAt: IsoDateFromString,
});

export type Dossier = t.TypeOf<typeof Dossier>;

export const newDossier = (
  issuer: Issuer,
  documentsMetadata: NonEmptyArray<DocumentMetadata>
): Dossier => ({
  id: newId(),
  issuerId: issuer.id,
  documentsMetadata,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export type InsertDossier = (dossier: Dossier) => TE.TaskEither<Error, Dossier>;

export type GetDossier = (
  dossierId: Dossier["id"]
) => (issuerId: Issuer["id"]) => TE.TaskEither<Error, O.Option<Dossier>>;

export const dossierNotFoundError = new EntityNotFoundError("Dossier");
