import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { readFromEnvironment } from "../../env";

export const EventHubConfig = t.type({
  // ITN — primary
  billingItnConnectionString: t.string,
  analyticsItnConnectionString: t.string,
  // WEU legacy — rimuovere dopo che PDND ha fatto lo switch a ITN
  billingConnectionString: t.string,
  analyticsConnectionString: t.string
});

type EventHubConfig = t.TypeOf<typeof EventHubConfig>;

export const getEventHubsConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  EventHubConfig
> = sequenceS(RE.Apply)({
  // ITN — primary
  billingItnConnectionString: readFromEnvironment(
    "BillingEventHubItnConnectionString"
  ),
  analyticsItnConnectionString: readFromEnvironment(
    "AnalyticsEventHubItnConnectionString"
  ),
  // WEU legacy — rimuovere dopo che PDND ha fatto lo switch a ITN
  billingConnectionString: readFromEnvironment(
    "BillingEventHubConnectionString"
  ),
  analyticsConnectionString: readFromEnvironment(
    "AnalyticsEventHubConnectionString"
  )
});
