import * as t from "io-ts";

import { pipe } from "fp-ts/function";
import * as RE from "fp-ts/lib/ReaderEither";

import { sequenceS } from "fp-ts/lib/Apply";
import {
  PdvTokenizerConfig,
  getPdvTokenizerConfigFromEnvironment,
} from "@internal/pdv-tokenizer/config";
import {
  StorageConfig,
  getStorageConfigFromEnvironment,
} from "../infra/azure/storage/config";

import {
  CosmosConfig,
  getCosmosConfigFromEnvironment,
} from "../infra/azure/cosmos/config";

export const Config = t.type({
  azure: t.type({
    storage: StorageConfig,
    cosmos: CosmosConfig,
  }),
  pagopa: t.type({
    tokenizer: PdvTokenizerConfig,
  }),
});

export type Config = t.TypeOf<typeof Config>;

export const getConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  Config
> = pipe(
  sequenceS(RE.Apply)({
    storage: getStorageConfigFromEnvironment,
    cosmos: getCosmosConfigFromEnvironment,
    tokenizer: getPdvTokenizerConfigFromEnvironment,
  }),
  RE.map((config) => ({
    azure: {
      storage: config.storage,
      cosmos: config.cosmos,
    },
    pagopa: {
      tokenizer: config.tokenizer,
    },
  }))
);
