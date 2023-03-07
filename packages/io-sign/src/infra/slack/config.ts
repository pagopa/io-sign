import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { pipe } from "fp-ts/lib/function";
import { readFromEnvironment } from "../env";

export const SlackConfig = t.type({
  apiBasePath: t.string,
  apiToken: t.string,
});

type SlackConfig = t.TypeOf<typeof SlackConfig>;

export const getSlackConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  SlackConfig
> = sequenceS(RE.Apply)({
  apiBasePath: pipe(
    readFromEnvironment("SlackApiBasePath"),
    RE.orElse(() => RE.right("https://slack.com"))
  ),
  apiToken: readFromEnvironment("SlackApiToken"),
});
