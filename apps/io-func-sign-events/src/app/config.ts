import {
  ApplicationInsightsConfig,
  getApplicationInsightsConfigFromEnvironment
} from "../infra/azure/application-insight";

type Config = {
  appinsights: ApplicationInsightsConfig;
};

export const getConfigFromEnvironment = (): Config => ({
  appinsights: getApplicationInsightsConfigFromEnvironment()
});
