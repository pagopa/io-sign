import { describe, it, expect, vi } from "vitest";

import { makeCreateApiKeyByIdHandler } from "../create-api-key-by-id";

import * as crypto from "node:crypto";

import { ApiKey } from "@io-sign/io-sign/api-key";

const apiKey: ApiKey = {
  displayName: "test key",
  cidrs: [],
  testers: [],
  environment: "test",
  institutionId: crypto.randomUUID(),
  status: "active",
  createdAt: new Date(),
  id: "my-api-key",
};

describe("createApiKeyByIdHandler", () => {
  it("returns ApiKeyById from ApiKey", async () => {
    const { apiKeysByIdOutput, handler } =
      makeCreateApiKeyByIdHandler("test-db");

    const extraOutputsData = new Map();
    const mockContext = {
      extraOutputs: {
        set: (binding: unknown, value: unknown) =>
          extraOutputsData.set(binding, value),
      },
      warn: vi.fn(),
    } as never;

    await handler([apiKey], mockContext);

    expect(extraOutputsData.get(apiKeysByIdOutput)).toEqual(
      expect.arrayContaining([
        {
          id: apiKey.id,
          institutionId: apiKey.institutionId,
        },
      ])
    );
  });
});
