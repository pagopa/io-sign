import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { readFromEnvironment } from "@io-sign/io-sign/infra/env";
import { pipe } from "fp-ts/lib/function";

export const LollipopExtConfig = t.type({
  apiBasePath: t.string,
  apiKey: t.string
});

export type LollipopExtConfig = t.TypeOf<typeof LollipopExtConfig>;

export const getLollipopExtConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  LollipopExtConfig
> = sequenceS(RE.Apply)({
  apiBasePath: pipe(
    readFromEnvironment("LollipopExternalApiBasePath"),
    RE.orElse(() => RE.right("https://api.io.pagopa.it"))
  ),
  apiKey: readFromEnvironment("LollipopExternalApiKey")
});

export const LollipopIntConfig = t.type({
  apiBasePath: t.string,
  apiKey: t.string
});

export type LollipopIntConfig = t.TypeOf<typeof LollipopIntConfig>;

export const getLollipopIntConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  LollipopIntConfig
> = sequenceS(RE.Apply)({
  apiBasePath: readFromEnvironment("LollipopInternalApiBasePath"),
  apiKey: readFromEnvironment("LollipopInternalApiKey")
});
