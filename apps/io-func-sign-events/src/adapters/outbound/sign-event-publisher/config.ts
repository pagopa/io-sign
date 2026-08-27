import { z } from "zod";

const ConfigFromEnvironment = z
  .object({
    SignEventsHubItnConnectionString: z.string().min(1)
  })
  .transform((env) => ({
    connectionString: env.SignEventsHubItnConnectionString
  }));

export type SignEventPublisherConfig = z.infer<typeof ConfigFromEnvironment>;

export const getSignEventPublisherConfigFromEnvironment =
  (): SignEventPublisherConfig => {
    const result = ConfigFromEnvironment.safeParse(process.env);
    if (!result.success) {
      throw new Error("error parsing SignEventPublisher config", {
        cause: result.error.issues
      });
    }
    return result.data;
  };
