import * as t from "io-ts";

import { pipe } from "fp-ts/function";
import * as RE from "fp-ts/lib/ReaderEither";

import { sequenceS } from "fp-ts/lib/Apply";
import {
  PdvTokenizerConfig,
  getPdvTokenizerConfigFromEnvironment,
} from "@internal/pdv-tokenizer/config";
import {
  IOServicesConfig,
  getIoServicesConfigFromEnvironment,
} from "@internal/io-services/config";

export const Config = t.type({
  pagopa: t.type({
    tokenizer: PdvTokenizerConfig,
    ioServices: IOServicesConfig,
  }),
});

export type Config = t.TypeOf<typeof Config>;

export const getConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  Config
> = pipe(
  sequenceS(RE.Apply)({
    tokenizer: getPdvTokenizerConfigFromEnvironment,
    ioServices: getIoServicesConfigFromEnvironment,
  }),
  RE.map((config) => ({
    pagopa: {
      tokenizer: config.tokenizer,
      ioServices: config.ioServices,
    },
  }))
);
