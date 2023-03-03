import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { readFromEnvironment } from "@io-sign/io-sign/infra/env";

export const SelfCareConfig = t.type({
  eventHubConnectionString: t.string,
  eventHubContractsName: t.string,
});

type SelfCareConfig = t.TypeOf<typeof SelfCareConfig>;

export const getSelfCareConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  SelfCareConfig
> = sequenceS(RE.Apply)({
  eventHubConnectionString: readFromEnvironment(
    "SelfCareEventHubConnectionString"
  ),
  eventHubContractsName: RE.right("sc-contracts"),
});
