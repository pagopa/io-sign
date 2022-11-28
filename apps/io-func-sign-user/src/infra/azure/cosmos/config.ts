import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { readFromEnvironment } from "@internal/io-sign/infra/env";

export const CosmosConfig = t.type({
  connectionString: t.string,
  dbName: t.string,
});

type CosmosConfig = t.TypeOf<typeof CosmosConfig>;

export const getCosmosConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  CosmosConfig
> = sequenceS(RE.Apply)({
  connectionString: readFromEnvironment("CosmosDbConnectionString"),
  dbName: readFromEnvironment("CosmosDbDatabaseName"),
});
