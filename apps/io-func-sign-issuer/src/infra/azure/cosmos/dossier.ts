import * as t from "io-ts";

import * as cosmos from "@azure/cosmos";

import { Dossier, GetDossier, InsertDossier } from "../../../dossier";

import {
  CosmosdbModel,
  BaseModel,
  CosmosResource,
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";

import * as TE from "fp-ts/lib/TaskEither";

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
  (issuerId) => {
    const model = new DossierModel(db);
    const result = model.find([dossierId, issuerId]);
    return TE.mapLeft(() => new Error("error getting the dossier"))(result);
  };

export const makeInsertDossier =
  (db: cosmos.Database): InsertDossier =>
  (dossier) => {
    const model = new DossierModel(db);
    const result = model.create(dossier);
    return TE.mapLeft(() => new Error("error creating the dossier"))(result);
  };
