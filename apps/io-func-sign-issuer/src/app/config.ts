import * as t from "io-ts";

import { pipe } from "fp-ts/function";
import * as RE from "fp-ts/lib/ReaderEither";

import { sequenceS } from "fp-ts/lib/Apply";

import {
  PdvTokenizerConfig,
  getPdvTokenizerConfigFromEnvironment,
} from "@io-sign/io-sign/infra/pdv-tokenizer/config";

import {
  IOServicesConfig,
  getIoServicesConfigFromEnvironment,
} from "@io-sign/io-sign/infra/io-services/config";

import {
  EventHubConfig,
  getEventHubsConfigFromEnvironment,
} from "@io-sign/io-sign/infra/azure/event-hubs/config";

import {
  ApplicationInsightsConfig,
  getApplicationInsightsConfigFromEnvironment,
} from "@io-sign/io-sign/infra/azure/appinsights/config";

import {
  StorageConfig,
  getStorageConfigFromEnvironment,
} from "../infra/azure/storage/config";

import {
  CosmosConfig,
  getCosmosConfigFromEnvironment,
} from "../infra/azure/cosmos/config";

import {
  getSelfCareConfigFromEnvironment,
  SelfCareConfig,
} from "../infra/self-care/config";

import {
  getSlackConfigFromEnvironment,
  SlackConfig,
} from "../infra/slack/config";

import {
  getBackOfficeConfigFromEnvironment,
  BackOfficeConfig,
} from "../infra/back-office/config";

export const Config = t.type({
  azure: t.type({
    storage: StorageConfig,
    cosmos: CosmosConfig,
    eventHubs: EventHubConfig,
    appinsights: ApplicationInsightsConfig,
  }),
  pagopa: t.type({
    tokenizer: PdvTokenizerConfig,
    ioServices: IOServicesConfig,
    selfCare: SelfCareConfig,
  }),
  slack: SlackConfig,
  backOffice: BackOfficeConfig,
});

export type Config = t.TypeOf<typeof Config>;

export const getConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  Config
> = pipe(
  sequenceS(RE.Apply)({
    storage: getStorageConfigFromEnvironment,
    cosmos: getCosmosConfigFromEnvironment,
    tokenizer: getPdvTokenizerConfigFromEnvironment,
    ioServices: getIoServicesConfigFromEnvironment,
    selfCare: getSelfCareConfigFromEnvironment,
    eventHubs: getEventHubsConfigFromEnvironment,
    slack: getSlackConfigFromEnvironment,
    backOffice: getBackOfficeConfigFromEnvironment,
    appinsights: getApplicationInsightsConfigFromEnvironment,
  }),
  RE.map((config) => ({
    azure: {
      storage: config.storage,
      cosmos: config.cosmos,
      eventHubs: config.eventHubs,
      appinsights: config.appinsights,
    },
    pagopa: {
      tokenizer: config.tokenizer,
      ioServices: config.ioServices,
      selfCare: config.selfCare,
    },
    slack: config.slack,
    backOffice: config.backOffice,
  }))
);
