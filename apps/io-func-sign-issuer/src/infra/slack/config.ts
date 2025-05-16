import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { readFromEnvironment } from "@io-sign/io-sign/infra/env";

export const SlackConfig = t.type({
  webhookUrl: t.string,
});

export type SlackConfig = t.TypeOf<typeof SlackConfig>;

export const getSlackConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  SlackConfig
> = sequenceS(RE.Apply)({
  webhookUrl: readFromEnvironment("SlackWebhookUrl"),
});
