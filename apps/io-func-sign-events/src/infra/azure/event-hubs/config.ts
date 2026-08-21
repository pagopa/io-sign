import { z } from "zod";

const ConfigFromEnvironment = z
  .object({
    SignEventsHubItnConnectionString: z.string().min(1)
  })
  .transform((env) => ({
    connectionString: env.SignEventsHubItnConnectionString
  }));

export type SignEventsHubConfig = z.infer<typeof ConfigFromEnvironment>;

export const getSignEventsHubConfigFromEnvironment =
  (): SignEventsHubConfig => {
    const result = ConfigFromEnvironment.safeParse(process.env);
    if (!result.success) {
      throw new Error("error parsing SignEventsHub config", {
        cause: result.error.issues
      });
    }
    return result.data;
  };
