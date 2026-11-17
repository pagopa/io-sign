import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import {
  readBooleanFromEnvironment,
  readFromEnvironment
} from "@io-sign/io-sign/infra/env";

export const CosmosConfig = t.type({
  useManagedIdentity: t.boolean,
  endpoint: t.union([t.string, t.undefined]),
  connectionString: t.string,
  dbName: t.string
});

type CosmosConfig = t.TypeOf<typeof CosmosConfig>;

export const getCosmosConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  CosmosConfig
> = sequenceS(RE.Apply)({
  useManagedIdentity: readBooleanFromEnvironment("USE_MANAGED_IDENTITY"),
  endpoint: RE.asks((env: NodeJS.ProcessEnv) => env.COSMOS_DB__accountEndpoint),
  connectionString: readFromEnvironment("CosmosDbConnectionString"),
  dbName: readFromEnvironment("CosmosDbDatabaseName")
});
