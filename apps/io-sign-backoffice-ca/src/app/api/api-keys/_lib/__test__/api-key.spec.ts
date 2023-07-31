import { vi, describe, it, expect } from "vitest";
import { ApiKeyAlreadyExistsError, createApiKey } from "../api-key";

const apiKeys = [
  {
    id: "01H54NWNGVPYFEY03W3XPB9ZDY",
    institutionId: "a0e07d4a-9792-4af3-8175-889aead727b8",
    displayName: "Comune di Cori - Anagrafe - Lorem Ipsum",
    environment: "DEFAULT",
    resourceId: "1689092259251",
    status: "ACTIVE",
    createdAt: new Date(),
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
  it("should throw a ApiKeyAlreadyExistsError on input body conflict", async () => {
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
      environment: "DEFAULT" as "DEFAULT",
      resourceId: "1689092259251",
    };

    expect(createApiKey(bodyRequest)).rejects.toThrowError(
      ApiKeyAlreadyExistsError
    );
  });

  it("should return a object { id, key } on success", async () => {
    const bodyRequest = {
      institutionId: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      displayName: "POLIBA - Dipartimento di Informatica (TEST)",
      environment: "TEST" as "TEST",
      resourceId: "1689092259251",
    };

    expect(createApiKey(bodyRequest)).resolves.toEqual({
      id: expect.any(String),
      key: expect.any(String),
    });
  });
});
