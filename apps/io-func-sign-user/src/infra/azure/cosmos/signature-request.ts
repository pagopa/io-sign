import {
  CosmosdbModel,
  BaseModel,
  CosmosResource,
  toCosmosErrorResponse,
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";

import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";

import * as cosmos from "@azure/cosmos";
import { pipe, flow } from "fp-ts/lib/function";

import { toCosmosDatabaseError } from "@io-sign/io-sign/infra/azure/cosmos/errors";

import * as E from "fp-ts/lib/Either";
import * as RA from "fp-ts/lib/ReadonlyArray";

import * as H from "@pagopa/handler-kit";

import {
  flattenAsyncIterable,
  asyncIterableToArray,
} from "@pagopa/io-functions-commons/dist/src/utils/async";

import { failure } from "io-ts/PathReporter";

import { Signer } from "@io-sign/io-sign/signer";
import {
  SignatureRequest,
  GetSignatureRequest,
  InsertSignatureRequest,
  UpsertSignatureRequest,
  SignatureRequestRepository,
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
      RetrievedSignatureRequest,
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
      TE.mapLeft(toCosmosDatabaseError),
    );

export const makeInsertSignatureRequest =
  (db: cosmos.Database): InsertSignatureRequest =>
  (signatureRequest) =>
    pipe(
      new SignatureRequestModel(db),
      (model) => model.create(signatureRequest),
      TE.mapLeft(toCosmosDatabaseError),
    );

export const makeUpsertSignatureRequest =
  (db: cosmos.Database): UpsertSignatureRequest =>
  (signatureRequest) =>
    pipe(
      new SignatureRequestModel(db),
      (model) => model.upsert(signatureRequest),
      TE.mapLeft(toCosmosDatabaseError),
    );

export class CosmosDbSignatureRequestRepository
  implements SignatureRequestRepository
{
  #model: SignatureRequestModel;

  constructor(db: cosmos.Database) {
    this.#model = new SignatureRequestModel(db);
  }

  findBySignerId(signerId: Signer["id"]) {
    return pipe(
      TE.tryCatch(
        () =>
          asyncIterableToArray(
            flattenAsyncIterable(
              this.#model.getQueryIterator({
                parameters: [
                  {
                    name: "@signerId",
                    value: signerId,
                  },
                ],
                query: `SELECT * FROM m WHERE m.signerId = @signerId`,
              }),
            ),
          ),
        toCosmosErrorResponse,
      ),
      TE.mapLeft(toCosmosDatabaseError),
      TE.chainEitherKW(
        flow(
          RA.sequence(E.Applicative),
          E.mapLeft((errors) => new H.ValidationError(failure(errors))),
        ),
      ),
    );
  }

  get(id: SignatureRequest["id"], signerId: SignatureRequest["signerId"]) {
    return pipe(
      this.#model.find([id, signerId]),
      TE.mapLeft(toCosmosDatabaseError),
    );
  }

  upsert(request: SignatureRequest) {
    return pipe(this.#model.upsert(request), TE.mapLeft(toCosmosDatabaseError));
  }
}
