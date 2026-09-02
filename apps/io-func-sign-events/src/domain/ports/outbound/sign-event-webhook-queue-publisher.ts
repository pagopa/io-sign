import type {
  GenericError,
  ServiceUnavailableError
} from "@pagopa/hexagonal-core/domain/errors";
import type { Result } from "neverthrow";
import { WebhookQueueEvent } from "../../webhook-queue-event.js";

export interface SignEventWebhookQueuePublisher {
  checkHealth(): Promise<Result<void, ServiceUnavailableError>>;
  enqueue(
    webhookQueueItem: WebhookQueueEvent,
    visibilityTimeout?: number
  ): Promise<Result<void, GenericError>>;
}
