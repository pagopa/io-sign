import * as t from "io-ts";
import * as RE from "fp-ts/lib/ReaderEither";
import { pipe } from "fp-ts/lib/function";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import {
  readBooleanFromEnvironment,
  readNonEmptyFromEnvironment
} from "../../env";

export const CosmosAuthConfig = t.union([
  t.type({
    useManagedIdentity: t.literal(true),
    endpoint: NonEmptyString
  }),
  t.type({
    useManagedIdentity: t.literal(false),
    connectionString: NonEmptyString
  })
]);

type CosmosAuthConfig = t.TypeOf<typeof CosmosAuthConfig>;

export const getCosmosAuthConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  CosmosAuthConfig
> = pipe(
  readBooleanFromEnvironment("USE_MANAGED_IDENTITY"),
  RE.chain(
    (
      useManagedIdentity
    ): RE.ReaderEither<NodeJS.ProcessEnv, Error, CosmosAuthConfig> =>
      useManagedIdentity
        ? pipe(
            readNonEmptyFromEnvironment("COSMOS_DB__accountEndpoint"),
            RE.map((endpoint) => ({ useManagedIdentity, endpoint }))
          )
        : pipe(
            readNonEmptyFromEnvironment("CosmosDbConnectionString"),
            RE.map((connectionString) => ({
              useManagedIdentity,
              connectionString
            }))
          )
  )
);
