import * as t from "io-ts";
import {
  ApplicationInsightsConfig,
  getApplicationInsightsConfigFromEnvironment
} from "@io-sign/io-sign/infra/azure/appinsights/config";
import { pipe } from "fp-ts/lib/function";
import * as RE from "fp-ts/lib/ReaderEither";

import {
  getPdvTokenizerConfigFromEnvironment,
  PdvTokenizerConfig
} from "@io-sign/io-sign/infra/pdv-tokenizer/config";
import {
  CosmosConfig,
  getCosmosConfigFromEnvironment
} from "../infra/azure/cosmos/config";
import { sequenceS } from "fp-ts/lib/Apply";

export const Config = t.type({
  azure: t.type({
    cosmos: CosmosConfig,
    appinsights: ApplicationInsightsConfig
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
  sequenceS(RE.Apply)({
    cosmos: getCosmosConfigFromEnvironment,
    tokenizer: getPdvTokenizerConfigFromEnvironment,
    appinsights: getApplicationInsightsConfigFromEnvironment
  }),
  RE.map((config) => ({
    azure: {
      cosmos: config.cosmos,
      appinsights: config.appinsights
    },
    pagopa: {
      tokenizer: config.tokenizer
    }
  }))
);
