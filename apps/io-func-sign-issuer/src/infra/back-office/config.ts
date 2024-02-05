import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { pipe } from "fp-ts/lib/function";
import { readFromEnvironment } from "@io-sign/io-sign/infra/env";
import { sequenceS } from "fp-ts/lib/Apply";

export const BackOfficeConfig = t.type({
  basePath: t.string,
  apiKey: t.string,
});

export type BackOfficeConfig = t.TypeOf<typeof BackOfficeConfig>;

export const getBackOfficeConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  BackOfficeConfig
> = pipe(
  sequenceS(RE.Apply)({
    basePath: pipe(
      readFromEnvironment("BackOfficeApiBasePath"),
      RE.orElse(() =>
        RE.right("https://api.io.pagopa.it/api/v1/sign/backoffice"),
      ),
    ),
    apiKey: readFromEnvironment("BackOfficeApiKey"),
  }),
);
