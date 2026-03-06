import { InvocationContext, output } from "@azure/functions";

import { pipe } from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as A from "fp-ts/Array";

import { validate } from "@io-sign/io-sign/validation";

import * as t from "io-ts";
import { RetrievedIssuer } from "../cosmos/issuer";

export const issuersByVatNumberViewOutput = output.cosmosDB({
  connection: "CosmosDbConnectionString",
  databaseName: "%CosmosDbDatabaseName%",
  containerName: "issuers-by-vat-number",
  createIfNotExists: false
});

export const createIssuersByVatNumberView = async (
  documents: unknown[],
  context: InvocationContext
): Promise<void> => {
  const result = pipe(
    documents,
    validate(t.array(RetrievedIssuer)),
    E.map(
      A.map((issuer) => ({
        id: issuer.vatNumber,
        issuerId: issuer.id,
        subscriptionId: issuer.subscriptionId
      }))
    )
  );
  if (E.isRight(result)) {
    context.extraOutputs.set(issuersByVatNumberViewOutput, result.right);
  }
};
