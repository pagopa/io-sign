import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";

import { readFromEnvironment } from "../env";

export const IoProfileConfig = t.type({
  basePath: t.string,
  apiKey: t.string,
  requestTimeout: t.number
});

type IoProfileConfig = t.TypeOf<typeof IoProfileConfig>;

export const getIoProfileConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  IoProfileConfig
> = sequenceS(RE.Apply)({
  basePath: readFromEnvironment("IoProfileApiBasePath"),
  apiKey: readFromEnvironment("IoProfileSubscriptionKey"),
  requestTimeout: RE.right(3000)
});
