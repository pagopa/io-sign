import * as t from "io-ts";
import * as tx from "io-ts-types";

import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { pipe } from "fp-ts/lib/function";

import * as O from "fp-ts/lib/Option";
import { NonEmptyArray } from "fp-ts/lib/NonEmptyArray";

import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";

import { Id, id as newId } from "@io-sign/io-sign/id";
import { DocumentMetadata } from "@io-sign/io-sign/document";

import { Issuer } from "@io-sign/io-sign/issuer";
import { NonEmptyString, EmailString } from "@pagopa/ts-commons/lib/strings";
import { EntityNotFoundError } from "@io-sign/io-sign/error";

export const DocumentsMetadata = tx.nonEmptyArray(DocumentMetadata);

export const Dossier = t.type({
  id: Id,
  title: NonEmptyString,
  issuerId: Issuer.props.id,
  documentsMetadata: DocumentsMetadata,
  supportEmail: EmailString,
  createdAt: IsoDateFromString,
  updatedAt: IsoDateFromString,
});

export type Dossier = t.TypeOf<typeof Dossier>;

export const newDossier = (
  issuer: Issuer,
  title: Dossier["title"],
  documentsMetadata: NonEmptyArray<DocumentMetadata>,
  supportEmail?: Dossier["supportEmail"]
): Dossier => ({
  id: newId(),
  title,
  issuerId: issuer.id,
  documentsMetadata,
  supportEmail: supportEmail ?? issuer.email, // the issuer has the chance to add a specific support email for a dossier. otherwise, the issuer's generic support email will be taken
  createdAt: new Date(),
  updatedAt: new Date(),
});

export type DossierRepository = {
  insert: (dossier: Dossier) => TE.TaskEither<Error, Dossier>;
  getById: (
    id: Dossier["id"],
    issuerId: Dossier["issuerId"]
  ) => TE.TaskEither<Error, O.Option<Dossier>>;
};

type DossierEnvironment = {
  dossierRepository: DossierRepository;
};

export const insertDossier =
  (d: Dossier): RTE.ReaderTaskEither<DossierEnvironment, Error, Dossier> =>
  ({ dossierRepository: repo }) =>
    repo.insert(d);

export const getDossierById =
  (
    id: Dossier["id"],
    issuerId: Dossier["issuerId"]
  ): RTE.ReaderTaskEither<DossierEnvironment, Error, Dossier> =>
  ({ dossierRepository: repo }) =>
    pipe(
      repo.getById(id, issuerId),
      TE.chain(
        TE.fromOption(
          () => new EntityNotFoundError("The specified dossier was not found")
        )
      )
    );

// LEGACY TYPES
// This block can be removed when the entire app has been ported to handler-kit@1
export type InsertDossier = (dossier: Dossier) => TE.TaskEither<Error, Dossier>;
export type GetDossier = (
  dossierId: Dossier["id"]
) => (issuerId: Issuer["id"]) => TE.TaskEither<Error, O.Option<Dossier>>;
// END
