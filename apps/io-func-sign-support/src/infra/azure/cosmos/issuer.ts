import {
  CosmosdbModel,
  BaseModel,
  CosmosResource,
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";

import * as TE from "fp-ts/TaskEither";

import * as t from "io-ts";

import * as cosmos from "@azure/cosmos";

import * as O from "fp-ts/Option";

import { Issuer, IssuerRepository } from "../../../issuer";

import { toCosmosDatabaseError } from "@io-sign/io-sign/infra/azure/cosmos/errors";

import { pipe } from "fp-ts/function";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

const IssuerByVatNumber = t.type({
  id: Issuer.props.vatNumber,
  issuerId: Issuer.props.id,
});

type IssuerByVatNumber = t.TypeOf<typeof IssuerByVatNumber>;

const NewIssuerByVatNumber = t.intersection([IssuerByVatNumber, BaseModel]);
type NewIssuerByVatNumber = t.TypeOf<typeof IssuerByVatNumber>;

const RetrievedIssuerByVatNumber = t.intersection([
  IssuerByVatNumber,
  CosmosResource,
]);

type RetrievedIssuerByVatNumber = t.TypeOf<typeof RetrievedIssuerByVatNumber>;

class IssuerIdByVatNumberModel extends CosmosdbModel<
  IssuerByVatNumber,
  NewIssuerByVatNumber,
  RetrievedIssuerByVatNumber,
  "id"
> {
  constructor(db: cosmos.Database) {
    super(
      db.container("issuers-by-vat-number"),
      NewIssuerByVatNumber,
      RetrievedIssuerByVatNumber
    );
  }
}

export class CosmosDbIssuerRepository implements IssuerRepository {
  #issuer: IssuerIdByVatNumberModel;

  constructor(db: cosmos.Database) {
    this.#issuer = new IssuerIdByVatNumberModel(db);
  }

  getByVatNumber(vatNumber: NonEmptyString) {
    return pipe(
      this.#issuer.find([vatNumber]),
      TE.mapLeft(toCosmosDatabaseError),
      TE.map(O.map(({ id: vatNumber, issuerId: id }) => ({ id, vatNumber })))
    );
  }
}
