import {
  GetSignatureRequest,
  InsertSignatureRequest,
  UpsertSignatureRequest,
  SignatureRequest,
} from "../../../signature-request";

import {
  CosmosdbModel,
  BaseModel,
  CosmosResource,
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";

import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";

import * as cosmos from "@azure/cosmos";
import { pipe } from "fp-ts/lib/function";

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
  (issuerId) => {
    const model = new SignatureRequestModel(db);
    return pipe(
      model.find([id, issuerId]),
      TE.mapLeft(() => new Error("NOT_IMPLEMENTED"))
    );
  };

export const makeInsertSignatureRequest =
  (db: cosmos.Database): InsertSignatureRequest =>
  (request) => {
    const model = new SignatureRequestModel(db);
    return pipe(
      model.create(request),
      TE.mapLeft(() => new Error("NOT_IMPLEMENTED"))
    );
  };

export const makeUpsertSignatureRequest =
  (db: cosmos.Database): UpsertSignatureRequest =>
  (request) => {
    const model = new SignatureRequestModel(db);
    return pipe(
      model.upsert(request),
      TE.mapLeft(() => new Error("NOT_IMPLEMENTED"))
    );
  };
