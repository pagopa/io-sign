import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { pipe } from "fp-ts/lib/function";
import { readFromEnvironment } from "@io-sign/io-sign/infra/env";
import {
  CosmosAuthConfig,
  getCosmosAuthConfigFromEnvironment
} from "@io-sign/io-sign/infra/azure/cosmos/config";

export const CosmosConfig = t.intersection([
  CosmosAuthConfig,
  t.type({ dbName: t.string })
]);

type CosmosConfig = t.TypeOf<typeof CosmosConfig>;

export const getCosmosConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  CosmosConfig
> = pipe(
  sequenceS(RE.Apply)({
    auth: getCosmosAuthConfigFromEnvironment,
    dbName: readFromEnvironment("CosmosDbDatabaseName")
  }),
  RE.map(({ auth, dbName }) => ({ ...auth, dbName }))
);
