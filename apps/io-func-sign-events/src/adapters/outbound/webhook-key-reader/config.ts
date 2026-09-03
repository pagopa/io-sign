import { z } from "zod";

const ConfigFromEnvironment = z
  .object({
    SignEventsKeyVaultUrl: z.url()
  })
  .transform((env) => ({
    vaultUrl: env.SignEventsKeyVaultUrl
  }));

export type WebhookKeyReaderConfig = z.infer<typeof ConfigFromEnvironment>;

export const getWebhookKeyReaderConfigFromEnvironment =
  (): WebhookKeyReaderConfig => {
    const result = ConfigFromEnvironment.safeParse(process.env);
    if (!result.success) {
      throw new Error("error parsing WebhookKeyReader config", {
        cause: result.error.issues
      });
    }
    return result.data;
  };
