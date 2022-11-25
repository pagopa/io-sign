import * as t from "io-ts";

import * as cosmos from "@azure/cosmos";

import {
  CosmosdbModel,
  BaseModel,
  CosmosResource,
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";

import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { Dossier, GetDossier, InsertDossier } from "../../../dossier";
import { toCosmosDatabaseError } from "@internal/io-sign/infra/azure/cosmos/errors";

const NewDossier = t.intersection([Dossier, BaseModel]);
type NewDossier = t.TypeOf<typeof NewDossier>;

const RetrievedDossier = t.intersection([Dossier, CosmosResource]);
type RetrievedDossier = t.TypeOf<typeof RetrievedDossier>;

class DossierModel extends CosmosdbModel<
  Dossier,
  NewDossier,
  RetrievedDossier,
  "issuerId"
> {
  constructor(db: cosmos.Database) {
    super(db.container("dossiers"), NewDossier, RetrievedDossier);
  }
}

export const makeGetDossier =
  (db: cosmos.Database): GetDossier =>
  (dossierId) =>
  (issuerId) =>
    pipe(
      new DossierModel(db),
      (model) => model.find([dossierId, issuerId]),
      TE.mapLeft(toCosmosDatabaseError)
    );

export const makeInsertDossier =
  (db: cosmos.Database): InsertDossier =>
  (dossier) =>
    pipe(
      new DossierModel(db),
      (model) => model.create(dossier),
      TE.mapLeft(toCosmosDatabaseError)
    );
