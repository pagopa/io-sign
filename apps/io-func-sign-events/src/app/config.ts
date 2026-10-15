import {
  ApplicationInsightsConfig,
  getApplicationInsightsConfigFromEnvironment
} from "@io-sign/hexagonal-azure-functions";
import {
  getWebhookConfigFromEnvironment,
  WebhookConfig
} from "./webhook-config.js";

type Config = {
  appinsights: ApplicationInsightsConfig;
  webhook: WebhookConfig;
};

export const getConfigFromEnvironment = (): Config => ({
  appinsights: getApplicationInsightsConfigFromEnvironment(),
  webhook: getWebhookConfigFromEnvironment()
});
