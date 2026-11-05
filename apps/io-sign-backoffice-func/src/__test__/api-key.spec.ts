import { describe, expect, it, vi } from "vitest";

import { ApiKey } from "@io-sign/io-sign/api-key";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import {
  ApiKeyRepository,
  getApiKeyById,
  toApiKeyAccessControl
} from "../api-key";

const apiKey: ApiKey = {
  displayName: "test key",
  cidrs: ["0.0.0.0/0"],
  testers: ["AAAAAA00A00A000A", "BBBBBB00B00B000B"],
  environment: "test",
  institutionId: "3f1c2d9e-8a4b-4c6d-9e2f-1a2b3c4d5e6f",
  status: "active",
  createdAt: new Date(),
  id: "my-api-key"
};

describe("toApiKeyAccessControl", () => {
  it("should keep only environment and testers", () => {
    expect(toApiKeyAccessControl(apiKey)).toEqual({
      environment: "test",
      testers: ["AAAAAA00A00A000A", "BBBBBB00B00B000B"]
    });
  });

  it("should keep an empty testers list", () => {
    expect(
      toApiKeyAccessControl({ ...apiKey, environment: "prod", testers: [] })
    ).toEqual({ environment: "prod", testers: [] });
  });
});

describe("getApiKeyById", () => {
  const makeRepository = (
    impl: ApiKeyRepository["getApiKeyById"]
  ): ApiKeyRepository => ({ getApiKeyById: vi.fn(impl) });

  it("should return the Api Key when found", async () => {
    const apiKeyRepository = makeRepository(async () => apiKey);
    const result = await getApiKeyById(apiKey.id)({ apiKeyRepository })();
    expect(result).toEqual({ _tag: "Right", right: apiKey });
    expect(apiKeyRepository.getApiKeyById).toHaveBeenCalledWith(apiKey.id);
  });

  it("should return an EntityNotFoundError when not found", async () => {
    const apiKeyRepository = makeRepository(async () => undefined);
    const result = await getApiKeyById("unknown")({ apiKeyRepository })();
    expect(result).toEqual({
      _tag: "Left",
      left: expect.any(EntityNotFoundError)
    });
  });

  it("should return a generic Error when the repository fails", async () => {
    const apiKeyRepository = makeRepository(async () => {
      throw new Error("db down");
    });
    const result = await getApiKeyById(apiKey.id)({ apiKeyRepository })();
    expect(result).toEqual({
      _tag: "Left",
      left: new Error("Error retrieving the Api Key.")
    });
  });
});
