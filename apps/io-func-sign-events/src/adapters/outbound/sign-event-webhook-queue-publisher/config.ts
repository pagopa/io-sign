import { z } from "zod";

const ConfigFromEnvironment = z
  .discriminatedUnion("USE_STORAGE_MANAGED_IDENTITY", [
    z.object({
      USE_STORAGE_MANAGED_IDENTITY: z.literal("true"),
      SIGN_STORAGE__queueServiceUri: z.url()
    }),
    z.object({
      USE_STORAGE_MANAGED_IDENTITY: z.literal("false"),
      StorageAccountItnConnectionString: z.string().min(1)
    })
  ])
  .transform((env) =>
    env.USE_STORAGE_MANAGED_IDENTITY === "true"
      ? {
          useManagedIdentity: true as const,
          queueServiceUri: env.SIGN_STORAGE__queueServiceUri
        }
      : {
          useManagedIdentity: false as const,
          connectionString: env.StorageAccountItnConnectionString
        }
  );

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
