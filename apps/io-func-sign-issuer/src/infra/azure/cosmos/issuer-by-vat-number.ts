import * as t from "io-ts";

import * as cosmos from "@azure/cosmos";

import {
  CosmosdbModel,
  BaseModel,
  CosmosResource,
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";

import { Issuer } from "@io-sign/io-sign/issuer";

export const IssuerByVatNumber = t.type({
  id: Issuer.props.vatNumber,
  issuerId: Issuer.props.id,
  subscriptionId: Issuer.props.subscriptionId,
});

export type IssuerByVatNumber = t.TypeOf<typeof IssuerByVatNumber>;

const NewIssuerByVatNumber = t.intersection([IssuerByVatNumber, BaseModel]);
type NewIssuerByVatNumber = t.TypeOf<typeof NewIssuerByVatNumber>;

const RetrievedIssuerByVatNumber = t.intersection([
  IssuerByVatNumber,
  CosmosResource,
]);
type RetrievedIssuerByVatNumber = t.TypeOf<typeof RetrievedIssuerByVatNumber>;

export class IssuerByVatNumberModel extends CosmosdbModel<
  IssuerByVatNumber,
  NewIssuerByVatNumber,
  RetrievedIssuerByVatNumber
> {
  constructor(db: cosmos.Database) {
    super(
      db.container("issuers-by-vat-number"),
      NewIssuerByVatNumber,
      RetrievedIssuerByVatNumber,
    );
  }
}
