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

export const Config = t.type({
  azure: t.type({
    storage: StorageConfig,
    cosmos: CosmosConfig,
  }),
  pagopa: t.type({
    tokenizer: PdvTokenizerConfig,
    ioServices: IOServicesConfig,
  }),
  namirial: NamirialConfig,
  uploadedStorageContainerName: t.string,
  validatedStorageContainerName: t.string,
  filledModulesStorageContainerName: t.string,
  documentsToFillQueueName: t.string,
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
  }),
  RE.map((config) => ({
    azure: {
      storage: config.storage,
      cosmos: config.cosmos,
    },
    pagopa: {
      tokenizer: config.tokenizer,
      ioServices: config.ioServices,
    },
    namirial: config.namirial,
    uploadedStorageContainerName: "uploaded-documents",
    validatedStorageContainerName: "validated-documents",
    filledModulesStorageContainerName: "filled-modules",
    documentsToFillQueueName: "waiting-for-documents-to-fill",
  }))
);
