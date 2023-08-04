import { vi, describe, it, expect } from "vitest";
import {
  ApiKeyAlreadyExistsError,
  createApiKey,
  getApiKey,
  listApiKeys,
} from "../api-key";

const mocks = vi.hoisted(() => ({
  apiKeys: [
    {
      id: "01GG4NFBCN4ZH8ETCCKX3766KX",
      institutionId: "8a6031b8-ca40-4ac1-86b6-c3bda65803d7",
      displayName: "displayName",
      environment: "DEFAULT",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    },
  ],
}));

const { getCosmosConfig, getCosmosContainerClient } = vi.hoisted(() => ({
  getCosmosConfig: vi.fn().mockReturnValue({
    cosmosContainerName: "cosmosContainerName",
  }),
  getCosmosContainerClient: vi.fn().mockReturnValue({
    items: {
      query: vi.fn(() => ({
        fetchAll: vi.fn().mockResolvedValue({
          resources: mocks.apiKeys,
        }),
      })),
      create: vi.fn().mockResolvedValue({}),
    },
    item: vi.fn().mockReturnValue({
      read: vi.fn().mockResolvedValue({
        resource: mocks.apiKeys[0],
      }),
    }),
  }),
}));

const { getApimClient } = vi.hoisted(() => ({
  getApimClient: vi.fn().mockReturnValue({
    getSecret: vi.fn().mockResolvedValue("0040820bee855345982b3ee534334b4"),
    createSubscription: vi.fn().mockResolvedValue("foo"),
    deleteSubscription: vi.fn(),
    getProduct: vi.fn(),
  }),
}));

vi.mock("@/lib/cosmos", () => ({
  getCosmosConfig,
  getCosmosContainerClient,
}));

vi.mock("@/lib/apim", () => ({
  getApimClient,
}));

describe.skip("createApiKey", () => {
  it("should throw a ApiKeyAlreadyExistsError on input body conflict", async () => {
    // these institutionId, displayName are already present in the mocked API keys
    const bodyRequest = {
      institutionId: "a0e07d4a-9792-4af3-8175-889aead727b8",
      displayName: "displayName",
      environment: "DEFAULT" as "DEFAULT",
    };

    expect(createApiKey(bodyRequest)).rejects.toThrowError(
      ApiKeyAlreadyExistsError
    );
  });

  it("should return a object { id, key } on success", async () => {
    getCosmosContainerClient.mockReturnValueOnce({
      items: {
        query: vi.fn(() => ({
          fetchAll: vi.fn().mockResolvedValue({
            resources: [],
          }),
        })),
        create: vi.fn().mockResolvedValue({}),
      },
    });

    const bodyRequest = {
      institutionId: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      displayName: "POLIBA - Dipartimento di Informatica (TEST)",
      environment: "TEST" as "TEST",
    };

    expect(createApiKey(bodyRequest)).resolves.toEqual({
      id: expect.any(String),
      key: expect.any(String),
    });
  });
});

describe("listApiKeys", () => {
  it("should return API keys list", async () => {
    const mockedApiKeys = mocks.apiKeys.map((apiKey) => {
      return { ...apiKey, key: "0040820bee855345982b3ee534334b4" };
    });

    expect(listApiKeys("institutionId", "DEFAULT")).resolves.toEqual(
      mockedApiKeys
    );
  });
});

describe("getApiKey", () => {
  it("should return the API key", async () => {
    expect(getApiKey("apiKeyId", "institutionId")).resolves.toEqual({
      ...mocks.apiKeys[0],
      key: "0040820bee855345982b3ee534334b4",
    });
  });
});
