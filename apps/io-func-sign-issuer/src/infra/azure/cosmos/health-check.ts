import { Database } from "@azure/cosmos";
import {
  HealthCheck,
  toHealthProblems
} from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

export type AzureCosmosProblemSource = "AzureCosmosDB";

export const makeAzureCosmosDbHealthCheck = (
  db: Database
): HealthCheck<AzureCosmosProblemSource> =>
  pipe(
    TE.tryCatch(
      () => db.client.getDatabaseAccount(),
      toHealthProblems("AzureCosmosDB")
    ),
    TE.map(() => true)
  );
