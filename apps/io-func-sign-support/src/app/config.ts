import * as t from "io-ts";

import { pipe } from "fp-ts/lib/function";
import * as RE from "fp-ts/lib/ReaderEither";

import {
  PdvTokenizerConfig,
  getPdvTokenizerConfigFromEnvironment
} from "@io-sign/io-sign/infra/pdv-tokenizer/config";
import {
  CosmosConfig,
  getCosmosConfigFromEnvironment
} from "../infra/azure/cosmos/config";

export const Config = t.type({
  azure: t.type({
    cosmos: CosmosConfig
  }),
  pagopa: t.type({
    tokenizer: PdvTokenizerConfig
  })
});

export type Config = t.TypeOf<typeof Config>;

export const getConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  Config
> = pipe(
  RE.Do,
  RE.bind("cosmos", () => getCosmosConfigFromEnvironment),
  RE.bind("tokenizer", () => getPdvTokenizerConfigFromEnvironment),
  RE.map((config) => ({
    azure: {
      cosmos: config.cosmos
    },
    pagopa: {
      tokenizer: config.tokenizer
    }
  }))
);
