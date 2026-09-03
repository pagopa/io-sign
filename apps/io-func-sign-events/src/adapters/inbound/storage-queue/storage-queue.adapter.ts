import {
  mountAzureFunctionsStorageQueueTrigger,
  type StorageQueueTriggerConfig
} from "@io-sign/hexagonal-azure-functions";
import type { BaseError } from "@pagopa/hexagonal-core/domain/errors";
import type { Logger, UseCase } from "@pagopa/hexagonal-core/domain/ports";
import type { WebhookQueueEvent } from "../../../domain/webhook-queue-event.js";
import { webhookQueueEvent } from "../../../domain/webhook-queue-event.js";

// Queue messages are enqueued as base64(JSON). The Functions runtime already
// base64-decodes the payload, so we may receive a JSON string, a Buffer or, if
// the runtime recognised the content as JSON, an object.
const inputMapper = (message: unknown): WebhookQueueEvent => {
  const parsed = Buffer.isBuffer(message)
    ? JSON.parse(message.toString("utf-8"))
    : typeof message === "string"
      ? JSON.parse(message)
      : message;
  return webhookQueueEvent.parse(parsed);
};

export const mountWebhookDeliveryAdapterTrigger = (
  useCaseFactory: (
    logger: Logger
  ) => UseCase<WebhookQueueEvent, void, BaseError>,
  config: StorageQueueTriggerConfig
): void => {
  mountAzureFunctionsStorageQueueTrigger({
    name: "deliverWebhookTrigger",
    config,
    inputMapper,
    useCaseFactory
  });
};
