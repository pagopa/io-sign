import { NumberFromString } from "@pagopa/ts-commons/lib/numbers";
import { sequenceS } from "fp-ts/lib/Apply";
import * as RE from "fp-ts/lib/ReaderEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { readFromEnvironment } from "../../env";

export const ApplicationInsightsConfig = t.type({
  instrumentationKey: t.string,
  samplingPercentage: NumberFromString
});

type ApplicationInsightsConfig = t.TypeOf<typeof ApplicationInsightsConfig>;

export const getApplicationInsightsConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  ApplicationInsightsConfig
> = sequenceS(RE.Apply)({
  instrumentationKey: readFromEnvironment("APPINSIGHTS_INSTRUMENTATIONKEY"),
  samplingPercentage: pipe(
    readFromEnvironment("APPINSIGHTS_SAMPLING_PERCENTAGE"),
    RE.chainEitherKW(NumberFromString.decode),
    RE.altW(() => RE.right(5))
  )
});
