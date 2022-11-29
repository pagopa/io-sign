import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { readFromEnvironment } from "@pagopa/io-sign/infra/env";

import { pipe } from "fp-ts/lib/function";

export const PdvTokenizerConfig = t.type({
  basePath: t.string,
  apiKey: t.string,
  requestTimeout: t.number,
});

type PdvTokenizerConfig = t.TypeOf<typeof PdvTokenizerConfig>;

export const getPdvTokenizerConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  PdvTokenizerConfig
> = sequenceS(RE.Apply)({
  basePath: pipe(
    readFromEnvironment("PdvTokenizerApiBasePath"),
    RE.orElse(() => RE.right("https://api.tokenizer.pdv.pagopa.it/"))
  ),
  apiKey: readFromEnvironment("PdvTokenizerApiKey"),
  requestTimeout: RE.right(1000),
});
