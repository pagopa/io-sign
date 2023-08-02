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
      id: "01H54NWNGVPYFEY03W3XPB9ZDY",
      institutionId: "a0e07d4a-9792-4af3-8175-889aead727b8",
      displayName: "Comune di Cori - Anagrafe - Lorem Ipsum",
      environment: "DEFAULT",
      status: "ACTIVE",
      createdAt: new Date(),
    },
  ],
}));

const { getCosmosConfig, getCosmosContainer } = vi.hoisted(() => ({
  getCosmosConfig: vi.fn().mockReturnValue({
    cosmosContainerName: "cosmosContainerName",
  }),
  getCosmosContainer: vi.fn().mockReturnValue({
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

const { getApimConfig, getApimClient } = vi.hoisted(() => ({
  getApimConfig: vi.fn().mockReturnValue({
    azure: { subscriptionId: "subscriptionId" },
    apim: {
      resourceGroupName: "resourceGroupName",
      serviceName: "serviceName",
      productName: "productName",
    },
  }),
  getApimClient: vi.fn().mockReturnValue({
    subscription: {
      createOrUpdate: vi.fn().mockResolvedValue({
        primaryKey: "foo",
      }),
      listSecrets: vi.fn().mockResolvedValue({
        primaryKey: "0040820bee855345982b3ee534334b4",
      }),
    },
  }),
}));

vi.mock("@/lib/cosmos", () => ({
  getCosmosConfig,
  getCosmosContainer,
}));

vi.mock("@/lib/apim", () => ({
  getApimConfig,
  getApimClient,
}));

describe("createApiKey", () => {
  it("should throw a ApiKeyAlreadyExistsError on input body conflict", async () => {
    // these institutionId, displayName are already present in the mocked API keys
    const bodyRequest = {
      institutionId: "a0e07d4a-9792-4af3-8175-889aead727b8",
      displayName: "Comune di Cori - Anagrafe - Lorem Ipsum",
      environment: "DEFAULT" as "DEFAULT",
    };

    expect(createApiKey(bodyRequest)).rejects.toThrowError(
      ApiKeyAlreadyExistsError
    );
  });

  it("should return a object { id, key } on success", async () => {
    getCosmosContainer.mockReturnValueOnce({
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
