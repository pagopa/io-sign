import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { readFromEnvironment } from "../../env";

export const EventHubConfig = t.type({
  eventsItnConnectionString: t.string
});

type EventHubConfig = t.TypeOf<typeof EventHubConfig>;

export const getEventHubsConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  EventHubConfig
> = sequenceS(RE.Apply)({
  eventsItnConnectionString: readFromEnvironment(
    "SignEventsHubSenderItnConnectionString"
  )
});
