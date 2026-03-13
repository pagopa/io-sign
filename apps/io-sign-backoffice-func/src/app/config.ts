import {
  getSlackConfigFromEnvironment,
  SlackConfig
} from "@/infra/slack/config";
import {
  getSelfcareConfigFromEnvironment,
  SelfcareConfig
} from "@/infra/selfcare/config";
import {
  getGoogleConfigFromEnvironment,
  GoogleConfig
} from "@/infra/google/config";
import {
  CosmosDBConfig,
  getCosmosDBConfigFromEnvironment
} from "@/infra/azure/cosmos";
import {
  getSelfcareApiClientConfigFromEnvironment,
  SelfcareApiClientConfig
} from "@/infra/selfcare/api-client";

type Config = {
  slack: SlackConfig;
  selfcare: {
    api: SelfcareApiClientConfig;
    contracts: SelfcareConfig;
  };
  google: GoogleConfig;
  cosmos: CosmosDBConfig;
};

export const getConfigFromEnvironment = (): Config => ({
  slack: getSlackConfigFromEnvironment(),
  selfcare: {
    api: getSelfcareApiClientConfigFromEnvironment(),
    contracts: getSelfcareConfigFromEnvironment()
  },
  google: getGoogleConfigFromEnvironment(),
  cosmos: getCosmosDBConfigFromEnvironment()
});
