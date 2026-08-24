import { z } from "zod";

const ConfigFromEnvironment = z.object({
  BackofficeFuncBaseUrl: z.string().url(),
  BackofficeFuncApiKey: z.string().min(1)
});

export type BackofficeFuncConfig = { baseUrl: string; apiKey: string };

export const getBackofficeFuncConfigFromEnvironment =
  (): BackofficeFuncConfig => {
    const result = ConfigFromEnvironment.safeParse(process.env);
    if (!result.success) {
      throw new Error(`BackofficeFunc config: ${result.error.message}`);
    }
    return {
      baseUrl: result.data.BackofficeFuncBaseUrl,
      apiKey: result.data.BackofficeFuncApiKey
    };
  };
