import {
  CosmosdbModel,
  BaseModel,
  CosmosResource,
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";

import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";

import * as cosmos from "@azure/cosmos";
import { pipe } from "fp-ts/lib/function";
import {
  GetSignatureRequest,
  InsertSignatureRequest,
  UpsertSignatureRequest,
  SignatureRequest,
} from "../../../signature-request";
import { toCosmosDatabaseError } from "./errors";

const NewSignatureRequest = t.intersection([SignatureRequest, BaseModel]);
type NewSignatureRequest = t.TypeOf<typeof NewSignatureRequest>;

const RetrievedSignatureRequest = t.intersection([
  SignatureRequest,
  CosmosResource,
]);
type RetrievedSignatureRequest = t.TypeOf<typeof RetrievedSignatureRequest>;

class SignatureRequestModel extends CosmosdbModel<
  SignatureRequest,
  NewSignatureRequest,
  RetrievedSignatureRequest,
  "issuerId"
> {
  constructor(db: cosmos.Database) {
    super(
      db.container("signature-requests"),
      NewSignatureRequest,
      RetrievedSignatureRequest
    );
  }
}

export const makeGetSignatureRequest =
  (db: cosmos.Database): GetSignatureRequest =>
  (id) =>
  (issuerId) =>
    pipe(
      new SignatureRequestModel(db),
      (model) => model.find([id, issuerId]),
      TE.mapLeft(toCosmosDatabaseError)
    );

export const makeInsertSignatureRequest =
  (db: cosmos.Database): InsertSignatureRequest =>
  (request) =>
    pipe(
      new SignatureRequestModel(db),
      (model) => model.create(request),
      TE.mapLeft(toCosmosDatabaseError)
    );

export const makeUpsertSignatureRequest =
  (db: cosmos.Database): UpsertSignatureRequest =>
  (request) =>
    pipe(
      new SignatureRequestModel(db),
      (model) => model.upsert(request),
      TE.mapLeft(toCosmosDatabaseError)
    );
