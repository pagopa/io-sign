import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { readFromEnvironment } from "@io-sign/io-sign/infra/env";
import { pipe } from "fp-ts/lib/function";

const SelfCareApiConfig = t.type({
  basePath: t.string,
  apiKey: t.string,
});

const SelfCareEventHubConfig = t.type({
  connectionString: t.string,
  contractsName: t.string,
});

export const SelfCareConfig = t.type({
  eventHub: SelfCareEventHubConfig,
  api: SelfCareApiConfig,
});

export type SelfCareConfig = t.TypeOf<typeof SelfCareConfig>;

export const getSelfCareConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  SelfCareConfig
> = pipe(
  sequenceS(RE.Apply)({
    eventHubConnectionString: readFromEnvironment(
      "SelfCareEventHubConnectionString"
    ),
    eventHubContractsName: RE.right("sc-contracts"),
    apiBasePath: pipe(
      readFromEnvironment("SelfCareApiBasePath"),
      RE.orElse(() => RE.right("https://api.selfcare.pagopa.it/"))
    ),
    apiKey: readFromEnvironment("SelfCareApiKey"),
  }),
  RE.map(
    ({
      eventHubConnectionString,
      eventHubContractsName,
      apiBasePath,
      apiKey,
    }) => ({
      eventHub: {
        connectionString: eventHubConnectionString,
        contractsName: eventHubContractsName,
      },
      api: {
        basePath: apiBasePath,
        apiKey,
      },
    })
  )
);
