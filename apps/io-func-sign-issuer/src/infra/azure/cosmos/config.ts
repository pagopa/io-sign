import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { readFromEnvironment } from "@io-sign/io-sign/infra/env";

export const CosmosConfig = t.type({
  endpoint: t.string,
  connectionString: t.string,
  dbName: t.string
});

type CosmosConfig = t.TypeOf<typeof CosmosConfig>;

export const getCosmosConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  CosmosConfig
> = sequenceS(RE.Apply)({
  endpoint: readFromEnvironment("CosmosDbEndpoint"),
  connectionString: readFromEnvironment("CosmosDbConnectionString"),
  dbName: readFromEnvironment("CosmosDbDatabaseName")
});
