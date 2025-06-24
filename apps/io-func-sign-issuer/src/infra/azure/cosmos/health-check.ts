import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";

import {
  HealthCheck,
  toHealthProblems
} from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";
import { Database } from "@azure/cosmos";

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
