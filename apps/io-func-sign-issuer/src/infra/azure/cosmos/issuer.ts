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

import { Issuer } from "@io-sign/io-sign/issuer";
import { GetIssuerBySubscriptionId } from "../../../issuer";

const NewIssuer = t.intersection([Issuer, BaseModel]);
type NewIssuer = t.TypeOf<typeof NewIssuer>;

const RetrievedIssuer = t.intersection([Issuer, CosmosResource]);
type RetrievedIssuer = t.TypeOf<typeof RetrievedIssuer>;

class IssuerModel extends CosmosdbModel<
  Issuer,
  NewIssuer,
  RetrievedIssuer,
  "subscriptionId"
> {
  constructor(db: cosmos.Database) {
    super(db.container("issuers"), NewIssuer, RetrievedIssuer);
  }
}

export const makeGetIssuerBySubscriptionId =
  (db: cosmos.Database): GetIssuerBySubscriptionId =>
  (subscriptionId) =>
    pipe(
      new IssuerModel(db),
      (model) => model.find([subscriptionId, subscriptionId]),
      TE.mapLeft(toCosmosDatabaseError)
    );
