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
  GetUploadMetadata,
  InsertUploadMetadata,
  UploadMetadata,
} from "../../../upload";
import { toCosmosDatabaseError } from "./errors";

const NewUploadMetadata = t.intersection([UploadMetadata, BaseModel]);
type NewUploadMetadata = t.TypeOf<typeof NewUploadMetadata>;

const RetrievedUploadMetadata = t.intersection([
  UploadMetadata,
  CosmosResource,
]);
type RetrievedUploadMetadata = t.TypeOf<typeof RetrievedUploadMetadata>;

class UploadMetadataModel extends CosmosdbModel<
  UploadMetadata,
  NewUploadMetadata,
  RetrievedUploadMetadata
> {
  constructor(db: cosmos.Database) {
    super(db.container("uploads"), NewUploadMetadata, RetrievedUploadMetadata);
  }
}

export const makeInsertUploadMetadata =
  (db: cosmos.Database): InsertUploadMetadata =>
  (uploadMetadata) =>
    pipe(
      new UploadMetadataModel(db),
      (model) => model.create(uploadMetadata),
      TE.mapLeft(toCosmosDatabaseError)
    );

export const makeGetUploadMetadata =
  (db: cosmos.Database): GetUploadMetadata =>
  (id) =>
    pipe(
      new UploadMetadataModel(db),
      (model) => model.find([id]),
      TE.mapLeft(toCosmosDatabaseError)
    );
