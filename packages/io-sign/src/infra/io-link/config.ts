import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { pipe } from "fp-ts/lib/function";
import { readFromEnvironment } from "../env";

export const IoLinkConfig = t.type({
  baseUrl: t.string,
});

export type IoLinkConfig = t.TypeOf<typeof IoLinkConfig>;

export const getIoLinkConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  IoLinkConfig
> = sequenceS(RE.Apply)({
  baseUrl: pipe(
    readFromEnvironment("IoLinkBaseUrl"),
    RE.orElse(() => RE.right("https://continua.io.pagopa.it")),
  ),
});
