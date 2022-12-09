import * as t from "io-ts";
import * as tx from "io-ts-types";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { NonEmptyArray } from "fp-ts/lib/NonEmptyArray";

import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";

import { Id, id as newId } from "@io-sign/io-sign/id";
import { DocumentMetadata } from "@io-sign/io-sign/document";

import { Issuer } from "@io-sign/io-sign/issuer";

export const DocumentsMetadata = tx.nonEmptyArray(DocumentMetadata);

export const Dossier = t.type({
  id: Id,
  title: t.string,
  issuerId: Issuer.props.id,
  documentsMetadata: DocumentsMetadata,
  createdAt: IsoDateFromString,
  updatedAt: IsoDateFromString,
});

export type Dossier = t.TypeOf<typeof Dossier>;

export const newDossier = (
  issuer: Issuer,
  title: Dossier["title"],
  documentsMetadata: NonEmptyArray<DocumentMetadata>
): Dossier => ({
  id: newId(),
  title,
  issuerId: issuer.id,
  documentsMetadata,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export type InsertDossier = (dossier: Dossier) => TE.TaskEither<Error, Dossier>;

export type GetDossier = (
  dossierId: Dossier["id"]
) => (issuerId: Issuer["id"]) => TE.TaskEither<Error, O.Option<Dossier>>;
