import * as t from "io-ts";

import * as RE from "fp-ts/ReaderEither";

import { pipe } from "fp-ts/function";

import { readFromEnvironment } from "@io-sign/io-sign/infra/env";

export const CosmosConfig = t.type({
  connectionString: t.string,
  issuerDbName: t.string,
  userDbName: t.string,
});

type CosmosConfig = t.TypeOf<typeof CosmosConfig>;

export const getCosmosConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  CosmosConfig
> = pipe(
  RE.Do,
  RE.bind("connectionString", () =>
    readFromEnvironment("CosmosDbConnectionString"),
  ),
  RE.bind("issuerDbName", () =>
    readFromEnvironment("CosmosDbIssuerDatabaseName"),
  ),
  RE.bind("userDbName", () => readFromEnvironment("CosmosDbUserDatabaseName")),
);
