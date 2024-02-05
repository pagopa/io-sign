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
  IoLinkConfig,
  getIoLinkConfigFromEnvironment,
} from "@io-sign/io-sign/infra/io-link/config";
import {
  StorageConfig,
  getStorageConfigFromEnvironment,
} from "../infra/azure/storage/config";
import {
  CosmosConfig,
  getCosmosConfigFromEnvironment,
} from "../infra/azure/cosmos/config";
import {
  getNamirialConfigFromEnvironment,
  NamirialConfig,
} from "../infra/namirial/config";
import {
  getLollipopConfigFromEnvironment,
  LollipopConfig,
} from "../infra/lollipop/config";

export const Config = t.type({
  azure: t.type({
    storage: StorageConfig,
    cosmos: CosmosConfig,
    eventHubs: EventHubConfig,
  }),
  pagopa: t.type({
    tokenizer: PdvTokenizerConfig,
    ioServices: IOServicesConfig,
    lollipop: LollipopConfig,
    ioLink: IoLinkConfig,
  }),
  namirial: NamirialConfig,
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
    namirial: getNamirialConfigFromEnvironment,
    lollipop: getLollipopConfigFromEnvironment,
    eventHubs: getEventHubsConfigFromEnvironment,
    ioLink: getIoLinkConfigFromEnvironment,
  }),
  RE.map((config) => ({
    azure: {
      storage: config.storage,
      cosmos: config.cosmos,
      eventHubs: config.eventHubs,
    },
    pagopa: {
      tokenizer: config.tokenizer,
      ioServices: config.ioServices,
      lollipop: config.lollipop,
      ioLink: config.ioLink,
    },
    namirial: config.namirial,
  })),
);
