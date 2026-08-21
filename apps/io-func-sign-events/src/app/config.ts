import {
  ApplicationInsightsConfig,
  getApplicationInsightsConfigFromEnvironment
} from "../infra/azure/application-insight.js";

type Config = {
  appinsights: ApplicationInsightsConfig;
};

export const getConfigFromEnvironment = (): Config => ({
  appinsights: getApplicationInsightsConfigFromEnvironment()
});
