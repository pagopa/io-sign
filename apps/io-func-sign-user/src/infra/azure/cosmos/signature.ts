import * as t from "io-ts";

import * as cosmos from "@azure/cosmos";

import {
  CosmosdbModel,
  BaseModel,
  CosmosResource,
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";

import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { toCosmosDatabaseError } from "@io-sign/io-sign/infra/azure/cosmos/errors";
import {
  Signature,
  GetSignature,
  InsertSignature,
  UpsertSignature,
} from "../../../signature";

const NewSignature = t.intersection([Signature, BaseModel]);
type NewSignature = t.TypeOf<typeof NewSignature>;

const RetrievedSignature = t.intersection([Signature, CosmosResource]);
type RetrievedSignature = t.TypeOf<typeof RetrievedSignature>;

class SignatureModel extends CosmosdbModel<
  Signature,
  NewSignature,
  RetrievedSignature,
  "signerId"
> {
  constructor(db: cosmos.Database) {
    super(db.container("signatures"), NewSignature, RetrievedSignature);
  }
}

export const makeGetSignature =
  (db: cosmos.Database): GetSignature =>
  (signatureId) =>
  (signerID) =>
    pipe(
      new SignatureModel(db),
      (model) => model.find([signatureId, signerID]),
      TE.mapLeft(toCosmosDatabaseError)
    );

export const makeInsertSignature =
  (db: cosmos.Database): InsertSignature =>
  (signature) =>
    pipe(
      new SignatureModel(db),
      (model) => model.create(signature),
      TE.mapLeft(toCosmosDatabaseError)
    );

export const makeUpsertSignature =
  (db: cosmos.Database): UpsertSignature =>
  (request) =>
    pipe(
      new SignatureModel(db),
      (model) => model.upsert(request),
      TE.mapLeft(toCosmosDatabaseError)
    );
