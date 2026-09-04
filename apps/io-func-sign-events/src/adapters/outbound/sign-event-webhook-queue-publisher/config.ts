import { z } from "zod";

const ConfigFromEnvironment = z
  .object({
    StorageAccountItnConnectionString: z.string().min(1)
  })
  .transform((env) => ({
    storageAccountConnectionString: env.StorageAccountItnConnectionString
  }));

export type SignEventWebhookQueuePublisherConfig = z.infer<
  typeof ConfigFromEnvironment
>;

export const getSignEventWebhookQueuePublisherConfigFromEnvironment =
  (): SignEventWebhookQueuePublisherConfig => {
    const result = ConfigFromEnvironment.safeParse(process.env);
    if (!result.success) {
      throw new Error("error parsing SignEventWebhookQueuePublisher config", {
        cause: result.error.issues
      });
    }
    return result.data;
  };
