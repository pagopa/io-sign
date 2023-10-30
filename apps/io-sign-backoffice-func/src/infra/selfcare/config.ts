import { sequenceS } from "fp-ts/lib/Apply";
import { pipe } from "fp-ts/lib/function";
import * as RE from "fp-ts/lib/ReaderEither";
import { readFromEnvironment } from "@io-sign/io-sign/infra/env";
import { z } from "zod";

const ConfigFromEnvironment = z
  .object({
    SelfCareEventHubConnectionString: z.string(),
    SELFCARE_API_BASE_PATH: z.string(),
    SELFCARE_API_KEY: z.string(),
  })
  .extend({ SELF_CARE_EVENT_HUB_CONTRACTS_NAME: z.string() })
  .transform((e) => ({
    eventHub: {
      connectionString: e.SelfCareEventHubConnectionString,
      contractsName: e.SELF_CARE_EVENT_HUB_CONTRACTS_NAME,
    },
    api: { basePath: e.SELFCARE_API_BASE_PATH, key: e.SELFCARE_API_KEY },
  }));

export type SelfcareConfig = z.infer<typeof ConfigFromEnvironment>;

export const getSelfCareConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  SelfcareConfig
> = pipe(
  sequenceS(RE.Apply)({
    eventHubConnectionString: readFromEnvironment(
      "SelfCareEventHubConnectionString"
    ),
    eventHubContractsName: readFromEnvironment(
      "SELFCARE_EVENT_HUB_CONTRACTS_NAME"
    ),
    apiBasePath: pipe(
      readFromEnvironment("SELFCARE_API_BASE_PATH"),
      RE.orElse(() => RE.right("https://api.selfcare.pagopa.it/"))
    ),
    apiKey: readFromEnvironment("SELFCARE_API_KEY"),
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
        key: apiKey,
      },
    })
  )
);
