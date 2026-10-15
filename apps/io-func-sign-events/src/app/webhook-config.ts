import { z } from "zod";
import { parseWebhookAllowlist } from "@io-sign/io-sign/webhook";

const ConfigFromEnvironment = z
  .object({
    WEBHOOK_ENABLED_INSTITUTION_IDS: z.string().optional()
  })
  .transform((env) => ({
    enabledInstitutionIds: parseWebhookAllowlist(
      env.WEBHOOK_ENABLED_INSTITUTION_IDS ?? "[]"
    )
  }));

export type WebhookConfig = z.infer<typeof ConfigFromEnvironment>;

export const getWebhookConfigFromEnvironment = (): WebhookConfig => {
  const result = ConfigFromEnvironment.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing Webhook config", {
      cause: result.error.issues
    });
  }
  return result.data;
};
