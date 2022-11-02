import {
  GetUploadMetadata,
  InsertUploadMetadata,
  UploadMetadata,
} from "../../../upload";

import {
  CosmosdbModel,
  BaseModel,
  CosmosResource,
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";

import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";

import * as cosmos from "@azure/cosmos";
import { pipe } from "fp-ts/lib/function";

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
  (uploadMetadata) => {
    const model = new UploadMetadataModel(db);
    return pipe(
      model.create(uploadMetadata),
      TE.mapLeft(() => new Error("NOT_IMPLEMENTED"))
    );
  };

export const makeGetUploadMetadata =
  (db: cosmos.Database): GetUploadMetadata =>
  (id) => {
    const model = new UploadMetadataModel(db);
    return pipe(
      model.find([id]),
      TE.mapLeft(() => new Error("NOT_IMPLEMENTED"))
    );
  };
