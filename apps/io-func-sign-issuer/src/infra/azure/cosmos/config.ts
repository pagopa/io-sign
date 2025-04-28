import { readFromEnvironment } from "@io-sign/io-sign/infra/env";
import { sequenceS } from "fp-ts/lib/Apply";
import * as RE from "fp-ts/lib/ReaderEither";
import * as t from "io-ts";

export const CosmosConfig = t.type({
  connectionString: t.string,
  dbName: t.string
});

type CosmosConfig = t.TypeOf<typeof CosmosConfig>;

export const getCosmosConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  CosmosConfig
> = sequenceS(RE.Apply)({
  connectionString: readFromEnvironment("CosmosDbConnectionString"),
  dbName: readFromEnvironment("CosmosDbDatabaseName")
});
