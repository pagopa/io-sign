import {
  CosmosdbModel,
  BaseModel,
  CosmosResource,
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";

import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";

import * as cosmos from "@azure/cosmos";
import { pipe } from "fp-ts/lib/function";

import { toCosmosDatabaseError } from "@io-sign/io-sign/infra/azure/cosmos/errors";

import {
  SignatureRequest,
  GetSignatureRequest,
  InsertSignatureRequest,
  UpsertSignatureRequest,
} from "../../../signature-request";

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
  "signerId"
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
  (signerId) =>
    pipe(
      new SignatureRequestModel(db),
      (model) => model.find([id, signerId]),
      TE.mapLeft(toCosmosDatabaseError)
    );

export const makeInsertSignatureRequest =
  (db: cosmos.Database): InsertSignatureRequest =>
  (signatureRequest) =>
    pipe(
      new SignatureRequestModel(db),
      (model) => model.create(signatureRequest),
      TE.mapLeft(toCosmosDatabaseError)
    );

export const makeUpsertSignatureRequest =
  (db: cosmos.Database): UpsertSignatureRequest =>
  (signatureRequest) =>
    pipe(
      new SignatureRequestModel(db),
      (model) => model.upsert(signatureRequest),
      TE.mapLeft(toCosmosDatabaseError)
    );
