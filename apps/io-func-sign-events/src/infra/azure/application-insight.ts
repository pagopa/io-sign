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
