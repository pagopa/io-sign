import type { BaseError } from "@pagopa/hexagonal-core/domain/errors";
import type { Logger, UseCase } from "@pagopa/hexagonal-core/domain/ports";
import type { WebhookDeliveryClient } from "../../domain/ports/outbound/webhook-delivery-client.js";
import type { WebhookKeyReader } from "../../domain/ports/outbound/webhook-key-reader.js";
import type { WebhookQueueEvent } from "../../domain/webhook-queue-event";
import { err, ok } from "neverthrow";
import { WebhookDeliveryPayload } from "../../domain/webhook-delivery-payload.js";
import { WebhookEvent } from "../../domain/webhook-event.js";

type DeliverWebhookDeps = {
  logger: Logger;
  webhookKeyReader: WebhookKeyReader;
  webhookDeliveryClient: WebhookDeliveryClient;
};

const toWebhookDeliveryPayload = (
  event: WebhookEvent
): WebhookDeliveryPayload => {
  const base = {
    eventId: event.eventId,
    eventType: event.eventType,
    timestamp: event.timestamp,
    generatedAt: event.generatedAt
  };
  switch (event.eventType) {
    case "signature-request.document.status.update":
      return {
        ...base,
        eventType: event.eventType,
        payload: {
          signatureRequestId: event.signatureRequestId,
          documentStatus: event.documentStatus,
          documentId: event.documentId
        }
      };
    case "signature-request.status.update":
      return {
        ...base,
        eventType: event.eventType,
        payload: {
          signatureRequestId: event.signatureRequestId,
          status: event.status
        }
      };
  }
};

export const makeDeliverWebhookUseCase =
  ({
    logger,
    webhookKeyReader,
    webhookDeliveryClient
  }: DeliverWebhookDeps): UseCase<WebhookQueueEvent, void, BaseError> =>
  async (queueEvent) => {
    logger.info(
      `Processing webhook event for issuer: ${JSON.stringify(queueEvent)}`
    );
    const privateKey = await webhookKeyReader.getPrivateKey(
      queueEvent.webhookPrivateKeySecretName
    );
    if (privateKey.isErr()) {
      return err(privateKey.error);
    }
    //const privateKeyPem = privateKey.value;
    
    const payload = toWebhookDeliveryPayload(queueEvent.webhookEvent);
    const signature = "";
    const webhookDeliveryResult = await webhookDeliveryClient.deliver(
      queueEvent.webhookUrl,
      signature,
      queueEvent.webhookPublicKeyThumbprint,
      payload
    );
    if (webhookDeliveryResult.isErr()) {
      return err(webhookDeliveryResult.error);
    }
    return ok(undefined);
  };
