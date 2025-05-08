import { readFromEnvironment } from "@io-sign/io-sign/infra/env";
import { sequenceS } from "fp-ts/lib/Apply";
import * as RE from "fp-ts/lib/ReaderEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

export const LollipopConfig = t.type({
  apiBasePath: t.string,
  apiKey: t.string
});

export type LollipopConfig = t.TypeOf<typeof LollipopConfig>;

export const getLollipopConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  LollipopConfig
> = sequenceS(RE.Apply)({
  apiBasePath: pipe(
    readFromEnvironment("LollipopApiBasePath"),
    RE.orElse(() => RE.right("https://api.io.pagopa.it"))
  ),
  apiKey: readFromEnvironment("LollipopApiKey")
});
