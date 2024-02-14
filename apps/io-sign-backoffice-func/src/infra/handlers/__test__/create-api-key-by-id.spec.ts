import { describe, it, expect } from "vitest";

import * as CreateApiKeyById from "../create-api-key-by-id";

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
  it("returns ApiKeyById from ApiKey", () => {
    const result = CreateApiKeyById.handler({
      input: [apiKey],
      inputDecoder: CreateApiKeyById.inputDecoder,
      logger: {
        log: () => () => {},
      },
    })();
    expect(result).resolves.toEqual(
      expect.objectContaining({
        right: expect.arrayContaining([
          {
            id: apiKey.id,
            institutionId: apiKey.institutionId,
          },
        ]),
      })
    );
  });
});
