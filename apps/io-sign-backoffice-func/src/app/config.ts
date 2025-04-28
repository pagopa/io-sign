import {
  CosmosDBConfig,
  getCosmosDBConfigFromEnvironment
} from "@/infra/azure/cosmos";
import {
  GoogleConfig,
  getGoogleConfigFromEnvironment
} from "@/infra/google/config";
import {
  SelfcareApiClientConfig,
  getSelfcareApiClientConfigFromEnvironment
} from "@/infra/selfcare/api-client";
import {
  SelfcareConfig,
  getSelfcareConfigFromEnvironment
} from "@/infra/selfcare/config";
import {
  SlackConfig,
  getSlackConfigFromEnvironment
} from "@/infra/slack/config";

interface Config {
  slack: SlackConfig;
  selfcare: {
    api: SelfcareApiClientConfig;
    contracts: SelfcareConfig;
  };
  google: GoogleConfig;
  cosmos: CosmosDBConfig;
}

export const getConfigFromEnvironment = (): Config => ({
  slack: getSlackConfigFromEnvironment(),
  selfcare: {
    api: getSelfcareApiClientConfigFromEnvironment(),
    contracts: getSelfcareConfigFromEnvironment()
  },
  google: getGoogleConfigFromEnvironment(),
  cosmos: getCosmosDBConfigFromEnvironment()
});
