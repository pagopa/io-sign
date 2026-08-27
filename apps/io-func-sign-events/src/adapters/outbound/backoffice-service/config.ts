import { z } from "zod";

const ConfigFromEnvironment = z.object({
  BackofficeFuncBaseUrl: z.string().url(),
  BackofficeFuncApiKey: z.string().min(1)
});

export type BackofficeServiceConfig = { baseUrl: string; apiKey: string };

export const getBackofficeServiceConfigFromEnvironment =
  (): BackofficeServiceConfig => {
    const result = ConfigFromEnvironment.safeParse(process.env);
    if (!result.success) {
      throw new Error(`BackofficeService config: ${result.error.message}`);
    }
    return {
      baseUrl: result.data.BackofficeFuncBaseUrl,
      apiKey: result.data.BackofficeFuncApiKey
    };
  };
