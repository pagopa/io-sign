import {
  ApplicationInsightsConfig,
  getApplicationInsightsConfigFromEnvironment
} from "@io-sign/hexagonal-azure-functions";

type Config = {
  appinsights: ApplicationInsightsConfig;
};

export const getConfigFromEnvironment = (): Config => ({
  appinsights: getApplicationInsightsConfigFromEnvironment()
});
