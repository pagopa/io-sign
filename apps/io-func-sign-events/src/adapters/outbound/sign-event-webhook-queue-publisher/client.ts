import { QueueClient } from "@azure/storage-queue";
import {
  GenericError,
  ServiceUnavailableError
} from "@pagopa/hexagonal-core/domain/errors";
import { err, ok } from "neverthrow";
import type { SignEventWebhookQueuePublisherConfig } from "./config.js";
import { SignEventWebhookQueuePublisher } from "../../../domain/ports/outbound/sign-event-webhook-queue-publisher.js";
import { WebhookQueueEvent } from "../../../domain/webhook-queue-event.js";

const enqueue = async (
  queueClient: QueueClient,
  event: WebhookQueueEvent,
  visibilityTimeout: number
): Promise<void> => {
  const queueEventText = JSON.stringify(event);
  // TODO: check correct stringify
  const queueEventBase64 = Buffer.from(queueEventText).toString("base64");
  await queueClient.sendMessage(queueEventBase64, { visibilityTimeout });
};

export const makeSignEventWebhookQueuePublisher = (
  { storageAccountConnectionString }: SignEventWebhookQueuePublisherConfig,
  webhookQueueName: string
): SignEventWebhookQueuePublisher => {
  const webhookStorageQueue = new QueueClient(
    storageAccountConnectionString,
    webhookQueueName
  );
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
    enqueue: async (event: WebhookQueueEvent, visibilityTimeout = 0) => {
      try {
        await enqueue(webhookStorageQueue, event, visibilityTimeout);
        return ok(undefined);
      } catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        return err(
          new GenericError(`failed to enqueue webhook queue event: ${detail}`)
        );
      }
    }
  };
};
