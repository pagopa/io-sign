import { QueueClient } from "@azure/storage-queue";
import { DefaultAzureCredential } from "@azure/identity";
import {
  BaseError,
  GenericError,
  ServiceUnavailableError
} from "@pagopa/hexagonal-core/domain/errors";
import { err, ok, Result } from "neverthrow";
import type { SignEventWebhookQueuePublisherConfig } from "./config.js";
import { SignEventWebhookQueuePublisher } from "../../../domain/ports/outbound/sign-event-webhook-queue-publisher.js";
import { WebhookQueueEvent } from "../../../domain/webhook-queue-event.js";

class StorageQueueError extends BaseError {
  name = "StorageQueueError";
  errorCode?: string;
  constructor(errorCode?: string) {
    super("Unable to enqueue the message.");
    this.errorCode = errorCode;
  }
}

export const makeSignEventWebhookQueuePublisher = (
  config: SignEventWebhookQueuePublisherConfig,
  webhookQueueName: string
): SignEventWebhookQueuePublisher => {
  const webhookStorageQueue = config.useManagedIdentity
    ? new QueueClient(
        `${config.queueServiceUri.replace(/\/$/, "")}/${webhookQueueName}`,
        new DefaultAzureCredential()
      )
    : new QueueClient(config.connectionString, webhookQueueName);
  return {
    checkHealth: async () => {
      try {
        await webhookStorageQueue.getProperties();
        return ok(undefined);
      } catch {
        return err(
          new ServiceUnavailableError(
            `sign-event webhook queue publisher unreachable.`
          )
        );
      }
    },
    enqueue: async (
      event: WebhookQueueEvent,
      visibilityTimeout = 0
    ): Promise<Result<void, StorageQueueError>> => {
      try {
        const queueEventText = JSON.stringify(event);
        const queueEventBase64 = Buffer.from(queueEventText).toString("base64");
        const response = await webhookStorageQueue.sendMessage(
          queueEventBase64,
          {
            visibilityTimeout
          }
        );
        if (response.errorCode === undefined) return ok();
        return err(new StorageQueueError(response.errorCode));
      } catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        return err(
          new GenericError(`webhook-queue-publisher error: ${detail}`)
        );
      }
    }
  };
};
