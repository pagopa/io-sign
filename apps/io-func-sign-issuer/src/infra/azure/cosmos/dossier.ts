import * as cosmos from "@azure/cosmos";
import { toCosmosDatabaseError } from "@io-sign/io-sign/infra/azure/cosmos/errors";
import {
  BaseModel,
  CosmosResource,
  CosmosdbModel
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import {
  Dossier,
  DossierRepository,
  GetDossier,
  InsertDossier
} from "../../../dossier";

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

export class CosmosDbDossierRepository implements DossierRepository {
  #model: DossierModel;

  constructor(db: cosmos.Database) {
    this.#model = new DossierModel(db);
  }

  insert(dossier: Dossier) {
    return pipe(this.#model.create(dossier), TE.mapLeft(toCosmosDatabaseError));
  }

  getById(id: Dossier["id"], issuerId: Dossier["issuerId"]) {
    return pipe(
      this.#model.find([id, issuerId]),
      TE.mapLeft(toCosmosDatabaseError)
    );
  }
}

// LEGACY FUNCTIONS
// This block can be removed when the entire app has been ported to handler-kit@1
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
// END
