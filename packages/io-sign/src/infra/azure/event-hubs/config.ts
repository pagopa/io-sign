import { sequenceS } from "fp-ts/lib/Apply";
import * as RE from "fp-ts/lib/ReaderEither";
import * as t from "io-ts";

import { readFromEnvironment } from "../../env";

export const EventHubConfig = t.type({
  billingConnectionString: t.string,
  analyticsConnectionString: t.string
});

type EventHubConfig = t.TypeOf<typeof EventHubConfig>;

export const getEventHubsConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  EventHubConfig
> = sequenceS(RE.Apply)({
  billingConnectionString: readFromEnvironment(
    "BillingEventHubConnectionString"
  ),
  analyticsConnectionString: readFromEnvironment(
    "AnalyticsEventHubConnectionString"
  )
});
