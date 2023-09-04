import { vi, describe, it, expect } from "vitest";

import { z } from "zod";

import {
  ApiKeyAlreadyExistsError,
  createApiKey,
  getApiKeyWithSecret,
  listApiKeys,
  upsertApiKeyField,
} from "@/lib/api-keys/use-cases";

import { ApiKey, apiKeySchema } from "../api-keys";

type SerializedApiKey = Omit<ApiKey, "createdAt"> & {
  createdAt: string;
};

const mocks: { apiKeys: Array<SerializedApiKey>; secret: string } = vi.hoisted(
  () => ({
    apiKeys: [
      {
        id: "01GG4NFBCN4ZH8ETCCKX3766KX",
        institutionId: "8a6031b8-ca40-4ac1-86b6-c3bda65803d7",
        displayName: "displayName",
        environment: "prod" as const,
        status: "active" as const,
        createdAt: new Date().toISOString(),
        cidrs: [],
        testers: [],
      },
    ],
    secret: "0040820bee855345982b3ee534334b4",
  })
);

const { patchItem } = vi.hoisted(() => ({
  patchItem: vi.fn(),
}));

const { getCosmosConfig, getCosmosContainerClient } = vi.hoisted(() => ({
  getCosmosConfig: vi.fn().mockReturnValue({
    cosmosContainerName: "cosmosContainerName",
  }),
  getCosmosContainerClient: vi.fn().mockReturnValue({
    items: {
      query: vi.fn().mockResolvedValue({}),
      create: vi.fn().mockResolvedValue({}),
    },
    item: vi.fn().mockReturnValue({
      read: vi.fn().mockResolvedValue({
        resource: mocks.apiKeys[0],
      }),
      patch: patchItem,
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

describe("createApiKey", () => {
  it("should throw a ApiKeyAlreadyExistsError on input body conflict", () => {
    const mockResponse = [...mocks.apiKeys];

    getCosmosContainerClient.mockReturnValueOnce({
      items: {
        query: vi.fn(() => ({
          getAsyncIterator: vi.fn().mockReturnValue({
            [Symbol.asyncIterator]: () => ({
              next: async () => ({
                done: mockResponse.length === 0,
                value: { resources: [mockResponse.shift()] },
              }),
            }),
          }),
        })),
      },
    });

    // these institutionId, displayName are already present in the mocked API keys
    const bodyRequest = {
      institutionId: "a0e07d4a-9792-4af3-8175-889aead727b8",
      displayName: "displayName",
      environment: "prod" as const,
      cidrs: [],
      testers: [],
    };
    expect(createApiKey(bodyRequest)).rejects.toThrowError(
      ApiKeyAlreadyExistsError
    );
  });

  it("should return a object { id, key } on success", () => {
    getCosmosContainerClient.mockReturnValueOnce({
      items: {
        query: vi.fn(() => ({
          getAsyncIterator: vi.fn().mockReturnValue({
            [Symbol.asyncIterator]: () => ({
              next: async () => ({
                done: true,
              }),
            }),
          }),
        })),
        create: vi.fn().mockResolvedValue({}),
      },
    });

    const bodyRequest = {
      institutionId: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      displayName: "POLIBA - Dipartimento di Informatica (TEST)",
      environment: "test" as const,
      cidrs: [],
      testers: [],
    };
    expect(createApiKey(bodyRequest)).resolves.toEqual(expect.any(String));
  });
});

describe("listApiKeys", () => {
  it("should return API keys list", () => {
    const serialized = [...mocks.apiKeys];
    const response = z.array(apiKeySchema).parse([...mocks.apiKeys]);

    getCosmosContainerClient.mockReturnValueOnce({
      items: {
        query: vi.fn(() => ({
          getAsyncIterator: vi.fn().mockReturnValue({
            [Symbol.asyncIterator]: () => ({
              next: async () => ({
                done: serialized.length === 0,
                value: { resources: [serialized.shift()] },
              }),
            }),
          }),
        })),
      },
    });
    expect(listApiKeys("institutionId")).resolves.toEqual(response);
  });
});

describe("getApiKeyWithSecret", () => {
  it("should return the API key", () => {
    expect(getApiKeyWithSecret("apiKeyId", "institutionId")).resolves.toEqual(
      expect.objectContaining({
        id: mocks.apiKeys[0].id,
        secret: mocks.secret,
      })
    );
  });
});

describe("upsertApiKeyField", () => {
  it.each([
    ["testers" as const, ["CVLZCU75L24C351K"]],
    ["cidrs" as const, ["10.10.10.10/24", "127.0.0.1/32"]],
  ])("should update the given field", async (field, value) => {
    await upsertApiKeyField("apiKeyId", "institutionId", field, value);
    expect(patchItem).toHaveBeenCalledWith({
      operations: [
        {
          op: "replace",
          path: `/${field}`,
          value,
        },
      ],
    });
  });
});
