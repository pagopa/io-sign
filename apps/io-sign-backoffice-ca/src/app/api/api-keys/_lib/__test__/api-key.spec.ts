import { z } from "zod";
import { NextRequest } from "next/server";
import { vi, describe, it, expect } from "vitest";
import { ApiKeyAlreadyExistsError, createApiKey } from "../api-key";

const apiKeys = [
  {
    id: "01H54NWNGVPYFEY03W3XPB9ZDY",
    institutionId: "a0e07d4a-9792-4af3-8175-889aead727b8",
    displayName: "Comune di Cori - Anagrafe - Lorem Ipsum",
    environment: "DEFAULT",
    resourceId: "1689092259251",
    primaryKey: "96e1a93a156b401d953b5a1b07ec534d",
    status: "ACTIVE",
  },
];
const mocks = { apiKeys };

const { getCosmosConfig, getCosmosClient } = vi.hoisted(() => ({
  getCosmosConfig: vi.fn().mockReturnValue({
    cosmosDbConnectionString: "cosmosDbConnectionString",
    cosmosDbName: "cosmosDbName",
    cosmosContainerName: "cosmosContainerName",
  }),
  getCosmosClient: vi.fn().mockReturnValue({
    database: vi.fn().mockReturnValue({
      container: vi.fn().mockReturnValue({
        items: {
          query: vi.fn(() => ({
            fetchAll: vi.fn().mockResolvedValue({
              resources: [],
            }),
          })),
          create: vi.fn().mockResolvedValue({}),
        },
      }),
    }),
  }),
}));

const { getApimConfig, getApimClient } = vi.hoisted(() => ({
  getApimConfig: vi.fn().mockReturnValue({
    azureSubscriptionId: "azureSubscriptionId",
    apimResourceGroupName: "apimResourceGroupName",
    apimServiceName: "apimServiceName",
    apimProductName: "apimProductName",
  }),
  getApimClient: vi.fn().mockReturnValue({
    subscription: {
      createOrUpdate: vi.fn().mockResolvedValue({
        primaryKey: "foo",
      }),
    },
  }),
}));

vi.mock("@/lib/cosmos", () => ({
  getCosmosConfig,
  getCosmosClient,
}));

vi.mock("@/app/api/api-keys/_lib/apim", () => ({
  getApimConfig,
  getApimClient,
}));

describe("CreateApiKey endpoint", () => {
  it("should return a 400 HTTP response on input validation", async () => {
    const request = {
      json: vi.fn(async () => ({ foo: "foo" })),
    } as unknown as NextRequest;
    expect(createApiKey(request)).rejects.toThrowError(z.ZodError);
  });

  it("should return a 409 HTTP response on input body conflict", async () => {
    // these institutionId, displayName and environment are already present in the mocked API keys
    getCosmosClient.mockReturnValueOnce({
      database: vi.fn().mockReturnValue({
        container: vi.fn().mockReturnValue({
          items: {
            query: vi.fn(() => ({
              fetchAll: vi.fn().mockResolvedValue({
                resources: mocks.apiKeys,
              }),
            })),
            create: vi.fn().mockResolvedValue({}),
          },
        }),
      }),
    });

    const bodyRequest = {
      institutionId: "a0e07d4a-9792-4af3-8175-889aead727b8",
      displayName: "Comune di Cori - Anagrafe - Lorem Ipsum",
      environment: "DEFAULT",
      resourceId: "1689092259251",
    };
    const request = {
      json: vi.fn(async () => bodyRequest),
    } as unknown as NextRequest;

    expect(createApiKey(request)).rejects.toThrowError(
      ApiKeyAlreadyExistsError
    );
  });

  it("should return a 201 HTTP response on success", async () => {
    const bodyRequest = {
      institutionId: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      displayName: "POLIBA - Dipartimento di Informatica (TEST)",
      environment: "TEST",
      resourceId: "1689092259251",
    };
    const request = {
      json: vi.fn(async () => bodyRequest),
    } as unknown as NextRequest;

    expect(createApiKey(request)).resolves.toEqual({
      id: expect.any(String),
      primaryKey: expect.any(String),
    });
  });
});
