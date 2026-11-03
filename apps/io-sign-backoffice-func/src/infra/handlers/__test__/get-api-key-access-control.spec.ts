import { describe, expect, it, vi } from "vitest";

import * as H from "@pagopa/handler-kit";
import { getApiKeyAccessControlHandler } from "../get-api-key-access-control";
import { ApiKeyRepository } from "@/api-key";
import { ApiKey } from "@io-sign/io-sign/api-key";

const logger = {
  log: () => () => {},
};

const apiKey: ApiKey = {
  displayName: "test key",
  cidrs: [],
  testers: ["AAAAAA00A00A000A"],
  environment: "test",
  institutionId: "123",
  status: "active",
  createdAt: new Date(),
  id: "my-api-key",
};

const testRepository: ApiKeyRepository = {
  getApiKeyById: vi.fn(async (id) => (id === apiKey.id ? apiKey : undefined)),
};

const requestWithId = (id: string): H.HttpRequest => ({
  ...H.request("http://localhost/api-keys/"),
  path: { id },
});

const invokeHandler = (req: H.HttpRequest) =>
  getApiKeyAccessControlHandler({
    logger,
    input: req,
    inputDecoder: H.HttpRequest,
    apiKeyRepository: testRepository,
  })();

describe("getApiKeyAccessControl", () => {
  it("should return a 422 HTTP response on invalid path param", async () => {
    const result = await invokeHandler(requestWithId(""));
    expect(result).toEqual(
      expect.objectContaining({
        right: expect.objectContaining({ statusCode: 422 }),
      })
    );
  });

  it("should return a 404 HTTP response on Api Key not found", async () => {
    const result = await invokeHandler(
      requestWithId("api-key-that-does-not-exists")
    );
    expect(result).toEqual(
      expect.objectContaining({
        right: expect.objectContaining({ statusCode: 404 }),
      })
    );
  });

  it("should return 200 HTTP response with only environment and testers", async () => {
    const result = await invokeHandler(requestWithId(apiKey.id));
    expect(result).toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 200,
          body: {
            environment: apiKey.environment,
            testers: apiKey.testers,
          },
        }),
      })
    );
  });

  it("should return 500 HTTP response on unhandled exception", async () => {
    vi.spyOn(testRepository, "getApiKeyById").mockRejectedValueOnce(
      new Error("a generic blocking error")
    );
    const result = await invokeHandler(requestWithId(apiKey.id));
    expect(result).toEqual(
      expect.objectContaining({
        right: expect.objectContaining({ statusCode: 500 }),
      })
    );
  });
});
