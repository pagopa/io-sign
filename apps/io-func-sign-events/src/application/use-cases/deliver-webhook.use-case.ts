import type {
  BaseError as BaseErrorType,
  GenericError as GenericErrorType
} from "@pagopa/hexagonal-core/domain/errors";
import { BaseError } from "@pagopa/hexagonal-core/domain/errors";
import { GenericError } from "@pagopa/hexagonal-core/domain/errors";
import type { Logger, UseCase } from "@pagopa/hexagonal-core/domain/ports";
import type { WebhookDeliveryClient } from "../../domain/ports/outbound/webhook-delivery-client.js";
import type { SecretReader } from "../../domain/ports/outbound/secret-reader.js";
import { WebhookQueueEvent } from "../../domain/webhook-queue-event";
import { err, ok, Result } from "neverthrow";
import { createPrivateKey, sign as signMessage } from "node:crypto";
import { SignEventWebhookQueuePublisher } from "../../domain/ports/outbound/sign-event-webhook-queue-publisher.js";
import { WebhookEvent } from "../../domain/webhook-event.js";

type DeliverWebhookDeps = {
  logger: Logger;
  secretReader: SecretReader;
  webhookDeliveryClient: WebhookDeliveryClient;
  webhookQueuePublisher: SignEventWebhookQueuePublisher;
};

class MaximumRetryReached extends BaseError {
  name = "MaximumRetryReached";
  eventId?: string;
  constructor(eventId?: string) {
    super("Unable to deliver the event to the webhook.");
    this.eventId = eventId;
  }
}

const createRetry = (
  queueEvent: WebhookQueueEvent
): { newQueueEvent: WebhookQueueEvent; visibilityTimeout: number } => {
  queueEvent.retryCount++;
  const visibilityTimeout =
    (queueEvent.retryCount < 6 ? Math.pow(2, queueEvent.retryCount) : 60) * 60;

  return { newQueueEvent: queueEvent, visibilityTimeout };
};

const makeSignature = (
  privateKeyBase64: string,
  webhookEvent: WebhookEvent
): Result<string, GenericErrorType> => {
  try {
    const privateJwk = JSON.parse(
      Buffer.from(privateKeyBase64, "base64url").toString("utf8")
    );
    const privateKey = createPrivateKey({
      key: privateJwk,
      format: "jwk"
    });

    const { eventId, eventType, timestamp, generatedAt, payload } =
      webhookEvent;
    const message = [
      eventId,
      eventType,
      timestamp.toISOString(),
      generatedAt.toISOString(),
      JSON.stringify(payload)
    ].join("\n");

    const signature = signMessage(
      null,
      Buffer.from(message, "utf8"),
      privateKey
    );

    return ok(signature.toString("base64url"));
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return err(new GenericError(`error making signature: ${detail}`));
  }
};

export const makeDeliverWebhookUseCase =
  ({
    logger,
    secretReader,
    webhookDeliveryClient,
    webhookQueuePublisher
  }: DeliverWebhookDeps): UseCase<WebhookQueueEvent, void, BaseErrorType> =>
  async (queueEvent) => {
    const {
      id,
      webhookPrivateKeySecretName,
      webhookEvent,
      webhookUrl,
      webhookPublicKeyThumbprint
    } = queueEvent;
    const privateKey = await secretReader.getSecret(
      webhookPrivateKeySecretName
    );
    if (privateKey.isErr()) return err(privateKey.error);

    webhookEvent.timestamp = new Date();

    const signature = makeSignature(privateKey.value, webhookEvent);
    if (signature.isErr()) return err(signature.error);

    const webhookDeliveryResult = await webhookDeliveryClient.deliver(
      webhookUrl,
      signature.value,
      webhookPublicKeyThumbprint,
      webhookEvent
    );
    if (webhookDeliveryResult.isErr()) {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - 7);
      if (webhookEvent.generatedAt < threshold)
        return err(new MaximumRetryReached(id));

      const { newQueueEvent, visibilityTimeout } = createRetry(queueEvent);
      await webhookQueuePublisher.enqueue(newQueueEvent, visibilityTimeout);
      logger.info("Webhook deliver fail", {
        webhookEventId: queueEvent.id,
        webhookEventRetry: queueEvent.retryCount - 1,
        webhookEventNextRetryInMinutes: visibilityTimeout / 60
      });
    }
    return ok(undefined);
  };
