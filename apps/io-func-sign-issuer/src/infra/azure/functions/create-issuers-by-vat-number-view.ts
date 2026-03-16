import { InvocationContext, output } from "@azure/functions";

import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import * as A from "fp-ts/lib/Array";

import { validate } from "@io-sign/io-sign/validation";

import * as t from "io-ts";
import { RetrievedIssuer } from "../cosmos/issuer";

export const makeCreateIssuersByVatNumberViewHandler = () => {
  const issuersByVatNumberViewOutput = output.cosmosDB({
    connection: "CosmosDbConnectionString",
    databaseName: "%CosmosDbDatabaseName%",
    containerName: "issuers-by-vat-number",
    createIfNotExists: false
  });

  const handler = async (
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
    if (E.isLeft(result)) {
      context.warn(
        "Failed to validate Cosmos documents for issuers-by-vat-number view",
        result.left
      );
      return;
    }
    context.extraOutputs.set(issuersByVatNumberViewOutput, result.right);
  };

  return { issuersByVatNumberViewOutput, handler };
};
