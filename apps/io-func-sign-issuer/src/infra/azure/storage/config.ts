import { readFromEnvironment } from "@io-sign/io-sign/infra/env";
import { sequenceS } from "fp-ts/lib/Apply";
import * as RE from "fp-ts/lib/ReaderEither";
import * as t from "io-ts";

export const StorageConfig = t.type({
  connectionString: t.string
});

type StorageConfig = t.TypeOf<typeof StorageConfig>;

export const getStorageConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  StorageConfig
> = sequenceS(RE.Apply)({
  connectionString: readFromEnvironment("StorageAccountConnectionString")
});
