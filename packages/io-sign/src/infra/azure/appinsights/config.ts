import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { pipe } from "fp-ts/lib/function";

import { sequenceS } from "fp-ts/lib/Apply";
import { readFromEnvironment } from "../../env";

export const ApplicationInsightsConfig = t.type({
  instrumentationKey: t.string,
  samplingPercentage: t.number,
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
    RE.chainEitherKW(t.number.decode),
    RE.altW(() => RE.right(5))
  ),
});
