import { NonEmptyArray } from "fp-ts/lib/NonEmptyArray";

import { DocumentMetadata } from "@io-sign/io-sign/document";

import { Issuer } from "@io-sign/io-sign/issuer";
import { Dossier, InsertDossier, newDossier } from "../../dossier";

export type CreateDossierPayload = {
  issuer: Issuer;
  title: Dossier["title"];
  documentsMetadata: NonEmptyArray<DocumentMetadata>;
};

export const makeCreateDossier =
  (insert: InsertDossier) =>
  ({ issuer, title, documentsMetadata }: CreateDossierPayload) =>
    insert(newDossier(issuer, title, documentsMetadata));
