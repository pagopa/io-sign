import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ok, err } from "neverthrow";
import { generateKeyPairSync } from "node:crypto";
import { GenericError } from "@pagopa/hexagonal-core/domain/errors";
import type { Logger } from "@pagopa/hexagonal-core/domain/ports";
import { makeDeliverWebhookUseCase } from "../deliver-webhook.use-case.js";
import type { WebhookQueueEvent } from "../../../domain/webhook-queue-event.js";
import type { SecretReader } from "../../../domain/ports/outbound/secret-reader.js";
import type { WebhookDeliveryClient } from "../../../domain/ports/outbound/webhook-delivery-client.js";
import type { SignEventWebhookQueuePublisher } from "../../../domain/ports/outbound/sign-event-webhook-queue-publisher.js";

const aQueueEventId = "01ARZ3NDEKTSV4RRFFQ69G5FB1";
const anEventId = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const aSignatureRequestId = "01ARZ3NDEKTSV4RRFFQ69G5FAW";
const aSecretName = "a-secret-name";
const aWebhookUrl = "https://example.com/webhook";
const aThumbprint = "a-thumbprint";
const now = new Date("2026-09-04T12:00:00.000Z");

const DAY_MS = 24 * 60 * 60 * 1000;

// The use case signs with `crypto.sign(null, ...)`, which requires an Ed25519 key.
const { privateKey } = generateKeyPairSync("ed25519");
const aPrivateKeyBase64 = Buffer.from(
  JSON.stringify(privateKey.export({ format: "jwk" }))
).toString("base64url");

const makeQueueEvent = ({
  retryCount = 0,
  generatedAt = new Date("2026-09-03T00:00:00.000Z")
} = {}): WebhookQueueEvent => ({
  id: aQueueEventId,
  webhookUrl: aWebhookUrl,
  webhookPrivateKeySecretName: aSecretName,
  webhookPublicKeyThumbprint: aThumbprint,
  retryCount,
  webhookEvent: {
    eventId: anEventId,
    eventType: "signature-request.status.update",
    timestamp: new Date("2026-09-01T00:00:00.000Z"),
    generatedAt,
    payload: {
      signatureRequestId: aSignatureRequestId,
      status: "SIGNED"
    }
  }
});

const makeLogger = (): Logger => ({
  debug: vi.fn(),
  error: vi.fn(),
  flush: () => Promise.resolve(),
  info: vi.fn(),
  trackEvent: vi.fn(),
  trackException: vi.fn(),
  warn: vi.fn(),
  with: vi.fn()
});

const makeSecretReader = (): SecretReader => ({
  getSecret: vi.fn(async () => ok(aPrivateKeyBase64))
});

const makeWebhookDeliveryClient = (): WebhookDeliveryClient => ({
  deliver: vi.fn(async () => ok(undefined))
});

const makeWebhookQueuePublisher = (): SignEventWebhookQueuePublisher => ({
  checkHealth: vi.fn(async () => ok(undefined)),
  enqueue: vi.fn(async () => ok(undefined))
});

const makeDeps = () => {
  const logger = makeLogger();
  const secretReader = makeSecretReader();
  const webhookDeliveryClient = makeWebhookDeliveryClient();
  const webhookQueuePublisher = makeWebhookQueuePublisher();
  const useCase = makeDeliverWebhookUseCase({
    logger,
    secretReader,
    webhookDeliveryClient,
    webhookQueuePublisher
  });
  return { logger, secretReader, webhookDeliveryClient, webhookQueuePublisher, useCase };
};

// Makes the delivery client fail, so the retry / max-retry branch runs.
const failDelivery = (client: WebhookDeliveryClient, message = "webhook down") => {
  client.deliver = vi.fn(async () => err(new GenericError(message)));
};

describe("makeDeliverWebhookUseCase", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads the private key from the secret named in the queue event", async () => {
    const { secretReader, useCase } = makeDeps();
    await useCase(makeQueueEvent());
    expect(secretReader.getSecret).toHaveBeenCalledWith(aSecretName);
  });

  it("returns err and does not deliver when the secret cannot be read", async () => {
    const { secretReader, webhookDeliveryClient, useCase } = makeDeps();
    const anError = new GenericError("keyvault unavailable");
    secretReader.getSecret = vi.fn(async () => err(anError));
    const result = await useCase(makeQueueEvent());
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe(anError);
    expect(webhookDeliveryClient.deliver).not.toHaveBeenCalled();
  });

  it("returns err and does not deliver when the private key is not a valid JWK", async () => {
    const { secretReader, webhookDeliveryClient, useCase } = makeDeps();
    secretReader.getSecret = vi.fn(async () => ok("not-a-jwk"));
    const result = await useCase(makeQueueEvent());
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain("error making signature");
    expect(webhookDeliveryClient.deliver).not.toHaveBeenCalled();
  });

  it("delivers the event to the configured url with a signature and thumbprint", async () => {
    const { webhookDeliveryClient, useCase } = makeDeps();
    const result = await useCase(makeQueueEvent());
    expect(result.isOk()).toBe(true);
    expect(webhookDeliveryClient.deliver).toHaveBeenCalledWith(
      aWebhookUrl,
      expect.any(String),
      aThumbprint,
      expect.objectContaining({ eventId: anEventId })
    );
    const [, signature] = vi.mocked(webhookDeliveryClient.deliver).mock.calls[0];
    expect(signature.length).toBeGreaterThan(0);
  });

  it("refreshes the event timestamp to the current time before delivering", async () => {
    const { webhookDeliveryClient, useCase } = makeDeps();
    await useCase(makeQueueEvent());
    const [, , , deliveredEvent] = vi.mocked(webhookDeliveryClient.deliver).mock.calls[0];
    expect(deliveredEvent.timestamp.toISOString()).toBe(now.toISOString());
  });

  it("does not enqueue a retry when delivery succeeds", async () => {
    const { webhookQueuePublisher, useCase } = makeDeps();
    await useCase(makeQueueEvent());
    expect(webhookQueuePublisher.enqueue).not.toHaveBeenCalled();
  });

  it("enqueues a retry with an incremented retry count and returns ok when delivery fails", async () => {
    const { webhookDeliveryClient, webhookQueuePublisher, useCase } = makeDeps();
    failDelivery(webhookDeliveryClient);
    const result = await useCase(makeQueueEvent({ retryCount: 0 }));
    expect(result.isOk()).toBe(true);
    expect(webhookQueuePublisher.enqueue).toHaveBeenCalledOnce();
    const [retryEvent] = vi.mocked(webhookQueuePublisher.enqueue).mock.calls[0];
    expect(retryEvent.retryCount).toBe(1);
  });

  it.each([
    [0, 120],
    [1, 240],
    [4, 1920],
    [5, 3600],
    [10, 3600]
  ])(
    "schedules the retry with an exponential backoff (retryCount %i -> %i seconds)",
    async (retryCount, expectedVisibilityTimeout) => {
      const { webhookDeliveryClient, webhookQueuePublisher, useCase } = makeDeps();
      failDelivery(webhookDeliveryClient);
      await useCase(makeQueueEvent({ retryCount }));
      expect(webhookQueuePublisher.enqueue).toHaveBeenCalledWith(
        expect.anything(),
        expectedVisibilityTimeout
      );
    }
  );

  it("logs the failed delivery with the next retry delay in minutes", async () => {
    const { logger, webhookDeliveryClient, useCase } = makeDeps();
    failDelivery(webhookDeliveryClient);
    await useCase(makeQueueEvent({ retryCount: 0 }));
    expect(logger.info).toHaveBeenCalledWith(
      "Webhook deliver fail",
      expect.objectContaining({
        webhookEventId: aQueueEventId,
        webhookEventNextRetryInMinutes: 2
      })
    );
  });

  it("returns MaximumRetryReached and does not enqueue when the event is older than 7 days", async () => {
    const { webhookDeliveryClient, webhookQueuePublisher, useCase } = makeDeps();
    failDelivery(webhookDeliveryClient);
    const result = await useCase(
      makeQueueEvent({ generatedAt: new Date(now.getTime() - 8 * DAY_MS) })
    );
    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();
    expect(error.name).toBe("MaximumRetryReached");
    expect((error as { eventId?: string }).eventId).toBe(aQueueEventId);
    expect(webhookQueuePublisher.enqueue).not.toHaveBeenCalled();
  });
});
