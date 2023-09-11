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

import { makeFetchWithTimeout } from "@io-sign/io-sign/infra/http/fetch-timeout";
import {
  defaultHeader,
  isSuccessful,
  responseToJson,
} from "@io-sign/io-sign/infra/client-utils";
import { getConfigFromEnvironment } from "../../../app/config";
import {
  ApiKey,
  GetIssuerBySubscriptionId,
  GetIssuerByVatNumber,
  IssuerRepository,
  getIssuerEnvironment,
} from "../../../issuer";
import { IssuerByVatNumberModel } from "./issuer-by-vat-number";

const NewIssuer = t.intersection([Issuer, BaseModel]);
type NewIssuer = t.TypeOf<typeof NewIssuer>;

export const RetrievedIssuer = t.intersection([Issuer, CosmosResource]);
export type RetrievedIssuer = t.TypeOf<typeof RetrievedIssuer>;

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

export class CosmosDbIssuerRepository implements IssuerRepository {
  #issuerModel: IssuerModel;
  #issuerByVatNumberModel: IssuerByVatNumberModel;

  constructor(db: cosmos.Database) {
    this.#issuerModel = new IssuerModel(db);
    this.#issuerByVatNumberModel = new IssuerByVatNumberModel(db);
  }

  getByVatNumber(vatNumber: Issuer["vatNumber"]) {
    return pipe(
      this.#issuerByVatNumberModel.find([vatNumber]),
      TE.chain(
        flow(
          O.fold(
            () => TE.of(O.none),
            (issuerByVatNumber) =>
              this.#issuerModel.find([
                issuerByVatNumber.issuerId,
                issuerByVatNumber.subscriptionId,
              ])
          )
        )
      ),
      TE.mapLeft(toCosmosDatabaseError)
    );
  }

  getBySubscriptionId(subscriptionId: Issuer["subscriptionId"]) {
    return pipe(
      this.#issuerModel.findBySubscriptionId(subscriptionId),
      TE.mapLeft(toCosmosDatabaseError)
    );
  }
}

// LEGACY FUNCTIONS
// This block can be removed when the entire app has been ported to handler-kit@1
export const makeGetIssuerByVatNumber =
  (db: cosmos.Database): GetIssuerByVatNumber =>
  (vatNumber: Issuer["vatNumber"]) =>
    pipe(
      new IssuerByVatNumberModel(db),
      (model) => model.find([vatNumber]),
      TE.chain(
        flow(
          O.fold(
            () => TE.of(O.none),
            (issuerByVatNumber) =>
              pipe(new IssuerModel(db), (model) =>
                model.find([
                  issuerByVatNumber.issuerId,
                  issuerByVatNumber.subscriptionId,
                ])
              )
          )
        )
      ),
      TE.mapLeft(toCosmosDatabaseError)
    );

export const makeGetIssuerBySubscriptionId =
  (_db: cosmos.Database): GetIssuerBySubscriptionId =>
  (subscriptionId) =>
    pipe(
      getConfigFromEnvironment(process.env),
      TE.fromEither,
      TE.chain(({ backOffice: { basePath, apiKey } }) =>
        pipe(
          TE.tryCatch(
            () =>
              makeFetchWithTimeout()(
                `${basePath}/api-keys/${subscriptionId}?include=institution`,
                {
                  method: "GET",
                  headers: {
                    ...defaultHeader,
                    "Ocp-Apim-Subscription-Key": apiKey,
                  },
                }
              ),
            E.toError
          )
        )
      ),
      TE.filterOrElse(
        isSuccessful,
        () => new Error("The attempt to get issuer from back office failed.")
      ),
      TE.chain(responseToJson(ApiKey, "Invalid format for institution")),
      TE.map(
        ({
          id,
          institutionId,
          environment,
          institution: { name, vatNumber },
          issuer: { id: issuerId, supportEmail },
        }) => ({
          id: issuerId,
          subscriptionId: id,
          email: supportEmail,
          description: name,
          internalInstitutionId: institutionId,
          environment: getIssuerEnvironment(environment, institutionId),
          vatNumber,
          department: "",
        })
      ),
      TE.map(O.some)
    );
// END

export const makeInsertIssuer =
  (db: cosmos.Database): InsertIssuer =>
  (issuer) =>
    pipe(
      new IssuerModel(db),
      (model) => model.create(issuer),
      TE.mapLeft(toCosmosDatabaseError)
    );

export type InsertIssuer = (issuer: Issuer) => TE.TaskEither<Error, Issuer>;

export const makeCheckIssuerWithSameVatNumber =
  (db: cosmos.Database) => (issuer: Issuer) =>
    pipe(
      issuer.vatNumber,
      makeGetIssuerByVatNumber(db),
      TE.chain((existentIssuer) =>
        O.isSome(existentIssuer)
          ? TE.left(new Error("An issuer already exists with this vatNumber"))
          : TE.right(issuer)
      )
    );
