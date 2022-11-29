import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { readFromEnvironment } from "@pagopa/io-sign/infra/env";

export const IOServicesConfig = t.type({
  basePath: t.string,
  subscriptionKey: t.string,
});

type IOServicesConfig = t.TypeOf<typeof IOServicesConfig>;

export const getIoServicesConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  IOServicesConfig
> = sequenceS(RE.Apply)({
  basePath: readFromEnvironment("IoServicesApiBasePath"),
  subscriptionKey: readFromEnvironment("IoServicesSubscriptionKey"),
  requestTimeout: RE.right(1000),
});
