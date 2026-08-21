import * as appInsights from "applicationinsights";
import { DistributedTracingModes } from "applicationinsights";
import type { AppInsightsTelemetryClient } from "@pagopa/hexagonal-core/adapters/logger";
import { z } from "zod";

const ConfigFromEnvironment = z
  .object({
    APPLICATIONINSIGHTS_CONNECTION_STRING: z.string().min(1).optional(),
    APPINSIGHTS_INSTRUMENTATIONKEY: z.string().min(1).optional(),
    APPINSIGHTS_SAMPLING_PERCENTAGE: z.coerce
      .number()
      .min(0)
      .max(100)
      .optional()
  })
  .transform((env) => ({
    applicationInsightsConnectionString:
      env.APPLICATIONINSIGHTS_CONNECTION_STRING ??
      env.APPINSIGHTS_INSTRUMENTATIONKEY ??
      "",
    applicationInsightsSamplingPercentage:
      env.APPINSIGHTS_SAMPLING_PERCENTAGE ?? 100
  }));

export type ApplicationInsightsConfig = z.infer<typeof ConfigFromEnvironment>;

export const getApplicationInsightsConfigFromEnvironment = () => {
  const result = ConfigFromEnvironment.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing ApplicationInsights config", {
      cause: result.error.issues
    });
  }
  return result.data;
};

export const makeAzureTelemetryClient = (
  config: ApplicationInsightsConfig
): AppInsightsTelemetryClient => {
  appInsights
    .setup(config.applicationInsightsConnectionString)
    .setDistributedTracingMode(DistributedTracingModes.AI_AND_W3C)
    .setSendLiveMetrics(true)
    .setUseDiskRetryCaching(false)
    .start();
  const client = appInsights.defaultClient;
  client.config.samplingPercentage =
    config.applicationInsightsSamplingPercentage;
  if (process.env.WEBSITE_SITE_NAME) {
    client.context.tags[client.context.keys.cloudRole] =
      process.env.WEBSITE_SITE_NAME;
  }
  return {
    trackTrace: (t) => client.trackTrace(t),
    trackEvent: (t) => client.trackEvent(t),
    trackException: (t) => client.trackException(t),
    flush: () =>
      new Promise<void>((resolve) =>
        client.flush({ callback: () => resolve() })
      )
  };
};
