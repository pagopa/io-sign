import type {
  BaseError,
  GenericError as GenericErrorType
} from "@pagopa/hexagonal-core/domain/errors";
import { GenericError } from "@pagopa/hexagonal-core/domain/errors";
import type { Logger, UseCase } from "@pagopa/hexagonal-core/domain/ports";
import type { WebhookDeliveryClient } from "../../domain/ports/outbound/webhook-delivery-client.js";
import type { SecretReader } from "../../domain/ports/outbound/secret-reader.js";
import type { WebhookQueueEvent } from "../../domain/webhook-queue-event";
import { err, ok, Result } from "neverthrow";
import { createPrivateKey, sign as signMessage } from "node:crypto";

type DeliverWebhookDeps = {
  logger: Logger;
  secretReader: SecretReader;
  webhookDeliveryClient: WebhookDeliveryClient;
};

const makeSignature = (
  privateKeyBase64: string,
  { webhookEvent }: WebhookQueueEvent
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
    secretReader,
    webhookDeliveryClient
  }: DeliverWebhookDeps): UseCase<WebhookQueueEvent, void, BaseError> =>
  async (queueEvent) => {
    const privateKey = await secretReader.getSecret(
      queueEvent.webhookPrivateKeySecretName
    );
    if (privateKey.isErr()) return err(privateKey.error);

    queueEvent.webhookEvent.timestamp = new Date();

    const signature = makeSignature(privateKey.value, queueEvent);
    if (signature.isErr()) return err(signature.error);

    const webhookDeliveryResult = await webhookDeliveryClient.deliver(
      queueEvent.webhookUrl,
      signature.value,
      queueEvent.webhookPublicKeyThumbprint,
      queueEvent.webhookEvent
    );
    if (webhookDeliveryResult.isErr()) {
      // Retry logic.
      return err(webhookDeliveryResult.error);
    }
    return ok(undefined);
  };
