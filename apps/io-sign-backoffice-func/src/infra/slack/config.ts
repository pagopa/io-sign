import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { readFromEnvironment } from "@io-sign/io-sign/infra/env";
import { z } from "zod";

const ConfigFromEnvironment = z
  .object({
    SLACK_WEBHOOK_URL: z.string(),
  })
  .transform((e) => ({
    webhookUrl: e.SLACK_WEBHOOK_URL,
  }));

export type SlackConfig = z.infer<typeof ConfigFromEnvironment>;

export const getSlackConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  SlackConfig
> = sequenceS(RE.Apply)({
  webhookUrl: readFromEnvironment("SLACK_WEBHOOK_URL"),
});
