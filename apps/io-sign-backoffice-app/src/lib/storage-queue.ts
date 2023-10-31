import { QueueServiceClient } from "@azure/storage-queue";
import { DefaultAzureCredential } from "@azure/identity";

import { z } from "zod";

const Config = z
  .object({
    STORAGE_ACCOUNT_NAME: z.string().min(1),
  })
  .transform((env) => ({
    account: env.STORAGE_ACCOUNT_NAME,
  }));

const getStorageQueueConfig = () => {
  const result = Config.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing storage queue config", {
      cause: result.error.issues,
    });
  }
  return result.data;
};

let queueServiceClient: QueueServiceClient;

const getQueueServiceClient = () => {
  if (!queueServiceClient) {
    const { account } = getStorageQueueConfig();
    queueServiceClient = new QueueServiceClient(
      `https://${account}.queue.core.windows.net`,
      new DefaultAzureCredential()
    );
  }
  return queueServiceClient;
};

export const getQueueClient = (queueName: string) =>
  getQueueServiceClient().getQueueClient(queueName);
