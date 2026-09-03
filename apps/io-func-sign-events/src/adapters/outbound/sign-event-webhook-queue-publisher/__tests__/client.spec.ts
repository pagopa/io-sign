import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GenericError,
  ServiceUnavailableError
} from "@pagopa/hexagonal-core/domain/errors";
import { makeSignEventWebhookQueuePublisher } from "../client.js";
import type { WebhookQueueEvent } from "../../../../domain/webhook-queue-event.js";

const sendMessage = vi.hoisted(() => vi.fn());
const getProperties = vi.hoisted(() => vi.fn());

vi.mock("@azure/storage-queue", () => ({
  QueueClient: vi.fn(() => ({ sendMessage, getProperties }))
}));

const config = {
  storageAccountConnectionString: "UseDevelopmentStorage=true"
};

const aWebhookQueueEvent: WebhookQueueEvent = {
  retryCount: 0,
  webhookUrl: "https://example.com/webhook",
  webhookPrivateKeySecretName: "a-secret-name",
  webhookPublicKeyThumbprint: "a-thumbprint",
  webhookEvent: {
    eventId: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    eventType: "signature-request.status.update",
    signatureRequestId: "01ARZ3NDEKTSV4RRFFQ69G5FAW",
    status: "SIGNED",
    generatedAt: new Date(),
    timestamp: new Date()
  }
};

const publisher = () =>
  makeSignEventWebhookQueuePublisher(config, "webhook-delivery");

describe("makeSignEventWebhookQueuePublisher", () => {
  beforeEach(() => {
    sendMessage.mockReset();
    getProperties.mockReset();
  });

  describe("checkHealth", () => {
    it("returns ok when the queue is reachable", async () => {
      getProperties.mockResolvedValue({});
      const result = await publisher().checkHealth();
      expect(result.isOk()).toBe(true);
    });

    it("returns a ServiceUnavailableError when the queue is unreachable", async () => {
      getProperties.mockRejectedValue(new Error("connection refused"));
      const result = await publisher().checkHealth();
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ServiceUnavailableError);
    });
  });

  describe("enqueue", () => {
    it("sends the base64 encoded event and returns ok", async () => {
      sendMessage.mockResolvedValue({ errorCode: undefined });
      const result = await publisher().enqueue(aWebhookQueueEvent, 30);
      expect(result.isOk()).toBe(true);
      const [message, options] = sendMessage.mock.calls[0];
      expect(JSON.parse(Buffer.from(message, "base64").toString())).toEqual(
        JSON.parse(JSON.stringify(aWebhookQueueEvent))
      );
      expect(options).toEqual({ visibilityTimeout: 30 });
    });

    it("defaults the visibility timeout to 0", async () => {
      sendMessage.mockResolvedValue({ errorCode: undefined });
      await publisher().enqueue(aWebhookQueueEvent);
      expect(sendMessage.mock.calls[0][1]).toEqual({ visibilityTimeout: 0 });
    });

    it("returns a StorageQueueError when the response carries an error code", async () => {
      sendMessage.mockResolvedValue({ errorCode: "QueueNotFound" });
      const result = await publisher().enqueue(aWebhookQueueEvent);
      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error.name).toBe("StorageQueueError");
      expect(error.message).toBe("Unable to enqueue the message.");
      expect(error).toHaveProperty("errorCode", "QueueNotFound");
    });

    it("returns a GenericError when sendMessage throws", async () => {
      sendMessage.mockRejectedValue(new Error("network error"));
      const result = await publisher().enqueue(aWebhookQueueEvent);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(GenericError);
      expect(result._unsafeUnwrapErr().message).toContain("network error");
    });
  });
});
