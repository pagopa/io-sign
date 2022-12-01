import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { readFromEnvironment } from "@internal/io-sign/infra/env";

export const QtspConfig = t.type({
  basePath: t.string,
  username: t.string,
  password: t.string,
  requestTimeout: t.number,
});

export type QtspConfig = t.TypeOf<typeof QtspConfig>;

export const getQtspConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  QtspConfig
> = sequenceS(RE.Apply)({
  basePath: readFromEnvironment("QtspApiBasePath"),
  username: readFromEnvironment("QtspUsername"),
  password: readFromEnvironment("QtspPassword"),
  requestTimeout: RE.right(10000),
});
