import { z } from "zod";

const ConfigFromEnvironment = z
  .object({
    SignEventsHubItnConnectionString: z.string().min(1)
  })
  .transform((env) => ({
    connectionString: env.SignEventsHubItnConnectionString
  }));

export type SignEventProducerConfig = z.infer<typeof ConfigFromEnvironment>;

export const getSignEventProducerConfigFromEnvironment =
  (): SignEventProducerConfig => {
    const result = ConfigFromEnvironment.safeParse(process.env);
    if (!result.success) {
      throw new Error("error parsing SignEventProducer config", {
        cause: result.error.issues
      });
    }
    return result.data;
  };
