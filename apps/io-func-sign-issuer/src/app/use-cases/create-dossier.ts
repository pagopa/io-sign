import { NonEmptyArray } from "fp-ts/lib/NonEmptyArray";

import { DocumentMetadata } from "@internal/io-sign/document";

import { InsertDossier, newDossier } from "../../dossier";
import { Issuer } from "../../issuer";

export type CreateDossierPayload = {
  issuer: Issuer;
  documentsMetadata: NonEmptyArray<DocumentMetadata>;
};

export const makeCreateDossier =
  (insert: InsertDossier) =>
  ({ issuer, documentsMetadata }: CreateDossierPayload) =>
    insert(newDossier(issuer, documentsMetadata));
