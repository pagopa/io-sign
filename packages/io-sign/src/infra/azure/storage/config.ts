import * as t from "io-ts";
import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { pipe } from "fp-ts/lib/function";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import {
  readBooleanFromEnvironment,
  readNonEmptyFromEnvironment
} from "../../env";

export const StorageConfig = t.union([
  t.type({
    useManagedIdentity: t.literal(true),
    blobServiceUri: NonEmptyString,
    queueServiceUri: NonEmptyString
  }),
  t.type({
    useManagedIdentity: t.literal(false),
    connectionString: NonEmptyString
  })
]);

export type StorageConfig = t.TypeOf<typeof StorageConfig>;

export const getStorageConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  StorageConfig
> = pipe(
  readBooleanFromEnvironment("USE_STORAGE_MANAGED_IDENTITY"),
  RE.chain(
    (
      useManagedIdentity
    ): RE.ReaderEither<NodeJS.ProcessEnv, Error, StorageConfig> =>
      useManagedIdentity
        ? pipe(
            sequenceS(RE.Apply)({
              blobServiceUri: readNonEmptyFromEnvironment(
                "SIGN_STORAGE__blobServiceUri"
              ),
              queueServiceUri: readNonEmptyFromEnvironment(
                "SIGN_STORAGE__queueServiceUri"
              )
            }),
            RE.map((uris) => ({ useManagedIdentity, ...uris }))
          )
        : pipe(
            readNonEmptyFromEnvironment("StorageAccountItnConnectionString"),
            RE.map((connectionString) => ({
              useManagedIdentity,
              connectionString
            }))
          )
  )
);
