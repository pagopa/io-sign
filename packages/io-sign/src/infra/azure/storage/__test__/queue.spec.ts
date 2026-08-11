import { describe, it, expect, vi } from "vitest";

import { QueueClient } from "@azure/storage-queue";

import * as E from "fp-ts/lib/Either";

import { enqueue } from "../queue";

const toBase64 = (payload: unknown) =>
  Buffer.from(JSON.stringify(payload)).toString("base64");

describe("enqueue", () => {
  it("sends the base64 encoded payload and returns the message id", async () => {
    const queueClient = {
      sendMessage: vi
        .fn()
        .mockResolvedValue({ messageId: "msg-1", errorCode: undefined })
    } as unknown as QueueClient;
    const payload = { hello: "world" };

    const result = await enqueue(payload)(queueClient)();

    expect(queueClient.sendMessage).toHaveBeenCalledWith(toBase64(payload), {
      visibilityTimeout: undefined
    });
    expect(result).toStrictEqual(E.right("msg-1"));
  });

  it("forwards the given visibility timeout", async () => {
    const queueClient = {
      sendMessage: vi
        .fn()
        .mockResolvedValue({ messageId: "msg-1", errorCode: undefined })
    } as unknown as QueueClient;

    await enqueue({ a: 1 }, 42)(queueClient)();

    expect(queueClient.sendMessage).toHaveBeenCalledWith(
      toBase64({ a: 1 }),
      { visibilityTimeout: 42 }
    );
  });

  it("returns Left(StorageQueueError) when the response has an error code", async () => {
    const queueClient = {
      sendMessage: vi
        .fn()
        .mockResolvedValue({ messageId: "msg-1", errorCode: "QueueNotFound" })
    } as unknown as QueueClient;

    const result = await enqueue({ a: 1 })(queueClient)();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.name).toBe("StorageQueueError");
      expect(result.left.message).toBe("Unable to enqueue the message.");
      expect(
        (result.left as unknown as { errorCode: string }).errorCode
      ).toBe("QueueNotFound");
    }
  });

  it("returns Left when sending the message rejects", async () => {
    const queueClient = {
      sendMessage: vi.fn().mockRejectedValue(new Error("boom"))
    } as unknown as QueueClient;

    const result = await enqueue({ a: 1 })(queueClient)();

    expect(E.isLeft(result)).toBe(true);
  });

  it("returns Left without calling sendMessage when the payload cannot be serialized", async () => {
    const queueClient = {
      sendMessage: vi.fn()
    } as unknown as QueueClient;
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    const result = await enqueue(circular)(queueClient)();

    expect(E.isLeft(result)).toBe(true);
    expect(queueClient.sendMessage).not.toHaveBeenCalled();
  });
});
