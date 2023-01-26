import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { readFromEnvironment } from "@io-sign/io-sign/infra/env";

export const EventHubConfig = t.type({
  connectionString: t.string,
});

type EventHubConfig = t.TypeOf<typeof EventHubConfig>;

export const getEventHubConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  EventHubConfig
> = sequenceS(RE.Apply)({
  connectionString: readFromEnvironment("EventHubsConnectionString"),
});
