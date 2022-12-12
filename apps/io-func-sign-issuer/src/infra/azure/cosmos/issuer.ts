import * as t from "io-ts";

import * as cosmos from "@azure/cosmos";

import {
  CosmosdbModel,
  BaseModel,
  CosmosResource,
  toCosmosErrorResponse,
  CosmosDecodingError,
  CosmosErrors,
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";

import { asyncIterableToArray } from "@pagopa/io-functions-commons/dist/src/utils/async";

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";

import { pipe, flow } from "fp-ts/lib/function";
import { toCosmosDatabaseError } from "@io-sign/io-sign/infra/azure/cosmos/errors";

import { Issuer } from "@io-sign/io-sign/issuer";
import * as RA from "fp-ts/lib/ReadonlyArray";
import { GetIssuerBySubscriptionId } from "../../../issuer";

const NewIssuer = t.intersection([Issuer, BaseModel]);
type NewIssuer = t.TypeOf<typeof NewIssuer>;

const RetrievedIssuer = t.intersection([Issuer, CosmosResource]);
type RetrievedIssuer = t.TypeOf<typeof RetrievedIssuer>;

const partitionKey = "subscriptionId" as const;

class IssuerModel extends CosmosdbModel<
  Issuer,
  NewIssuer,
  RetrievedIssuer,
  typeof partitionKey
> {
  constructor(db: cosmos.Database) {
    super(db.container("issuers"), NewIssuer, RetrievedIssuer);
  }

  findBySubscriptionId(
    subscriptionId: string
  ): TE.TaskEither<CosmosErrors, O.Option<RetrievedIssuer>> {
    return pipe(
      TE.tryCatch(
        () =>
          pipe(
            this.getQueryIterator({
              parameters: [
                {
                  name: "@partitionKey",
                  value: subscriptionId,
                },
              ],
              query: `SELECT * FROM m WHERE m.${partitionKey} = @partitionKey`,
            }),
            asyncIterableToArray
          ),
        toCosmosErrorResponse
      ),
      TE.map(RA.flatten),
      TE.chainW(
        flow(E.sequenceArray, E.mapLeft(CosmosDecodingError), TE.fromEither)
      ),
      TE.map(RA.head)
    );
  }
}

export const makeGetIssuerBySubscriptionId =
  (db: cosmos.Database): GetIssuerBySubscriptionId =>
  (subscriptionId) =>
    pipe(
      new IssuerModel(db),
      (model) => model.findBySubscriptionId(subscriptionId),
      TE.mapLeft(toCosmosDatabaseError)
    );
