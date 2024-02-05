import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { pipe } from "fp-ts/lib/function";

import { sequenceS } from "fp-ts/lib/Apply";
import { Ulid } from "@pagopa/ts-commons/lib/strings";
import { readFromEnvironment } from "../env";
import { validate } from "../../validation";

export const IOServicesConfig = t.type({
  basePath: t.string,
  subscriptionKey: t.string,
  configurationId: Ulid,
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
  configurationId: pipe(
    readFromEnvironment("IoServicesConfigurationId"),
    RE.chainEitherKW(validate(Ulid)),
  ),
});
