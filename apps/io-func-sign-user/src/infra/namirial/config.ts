import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { readFromEnvironment } from "@internal/io-sign/infra/env";

export const NamirialConfig = t.type({
  basePath: t.string,
  username: t.string,
  password: t.string,
  requestTimeoutMs: t.number,
});

export type NamirialConfig = t.TypeOf<typeof NamirialConfig>;

export const getNamirialConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  NamirialConfig
> = sequenceS(RE.Apply)({
  basePath: readFromEnvironment("NamirialApiBasePath"),
  username: readFromEnvironment("NamirialUsername"),
  password: readFromEnvironment("NamirialPassword"),
  requestTimeoutMs: RE.right(5000),
});
