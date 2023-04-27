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

import { Dossier } from "../../../dossier";
import {
  GetSignatureRequest,
  InsertSignatureRequest,
  UpsertSignatureRequest,
  SignatureRequest,
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

export const makeUpsertSignatureRequest =
  (db: cosmos.Database): UpsertSignatureRequest =>
  (request) =>
    pipe(
      new SignatureRequestModel(db),
      (model) => model.upsert(request),
      TE.mapLeft(toCosmosDatabaseError)
    );

export class CosmosDbSignatureRequestRepository
  implements SignatureRequestRepository
{
  #container: cosmos.Container;
  #model: SignatureRequestModel;

  constructor(container: cosmos.Container) {
    this.#container = container;
    this.#model = new SignatureRequestModel(this.#container.database);
  }

  public get(
    id: SignatureRequest["id"],
    issuerId: SignatureRequest["issuerId"]
  ) {
    return pipe(
      this.#model.find([id, issuerId]),
      TE.mapLeft(toCosmosDatabaseError)
    );
  }

  public upsert(request: SignatureRequest) {
    return pipe(this.#model.upsert(request), TE.mapLeft(toCosmosDatabaseError));
  }

  public insert(request: SignatureRequest) {
    return pipe(this.#model.create(request), TE.mapLeft(toCosmosDatabaseError));
  }

  public async findByDossier(
    dossier: Dossier,
    options: { maxItemCount?: number; continuationToken?: string } = {}
  ): Promise<{
    // TODO: take a decision on validation at "database level" via RFC
    items: ReadonlyArray<unknown>;
    continuationToken?: string;
  }> {
    const { resources: items, continuationToken } = await this.#container.items
      .query(
        {
          parameters: [
            {
              name: "@dossierId",
              value: dossier.id,
            },
          ],
          query: "SELECT * FROM m WHERE m.dossierId = @dossierId",
        },
        {
          partitionKey: dossier.issuerId,
          continuationToken: options.continuationToken,
          maxItemCount: options.maxItemCount ?? 25,
        }
      )
      .fetchNext();
    return {
      items,
      continuationToken,
    };
  }
}
