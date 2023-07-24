import { NextRequest } from "next/server";
import { ParsingError } from "@/error";
import { addApiKey } from "../add-api-key";
import { ApiKeyAlreadyExistsError } from "@/api-key";
import { vi, describe, it, expect } from "vitest";

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
const { getCosmosClient } = vi.hoisted(() => ({
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

vi.mock("@/infra/azure/cosmos/config", () => ({
  getCosmosConfigFromEnvironment: vi.fn().mockReturnValue({
    accountEndpoint: "accountEndpoint",
    accountKey: "accountKey",
    dbName: "dbName",
    containerName: "containerName",
  }),
}));

vi.mock("@/infra/azure/cosmos/client", () => {
  return {
    getCosmosClient,
    // getCosmosClient: vi.fn().mockReturnValue({
    //   database: vi.fn().mockReturnValue({
    //     container: vi.fn().mockReturnValue({
    //       items: {
    //         query: vi.fn(() => ({
    //           fetchAll: vi
    //             .fn()
    //             .mockResolvedValueOnce({
    //               resources: [],
    //             })
    //             .mockResolvedValue({
    //               resources: mocks.apiKeys,
    //             }),
    //         })),
    //         create: vi.fn().mockResolvedValue({}),
    //       },
    //     }),
    //   }),
    // }),
  };
});

vi.mock("@/infra/azure/api-management/config", () => ({
  getApimConfigFromEnvironment: vi.fn().mockReturnValue({
    subscriptionId: "subscriptionId",
    resourceGroupName: "resourceGroupName",
    serviceName: "serviceName",
    productName: "productName",
  }),
}));

vi.mock("@/infra/azure/api-management/client", () => ({
  getApimClient: vi.fn().mockReturnValue({
    subscription: {
      createOrUpdate: vi.fn().mockResolvedValue({
        primaryKey: "foo",
      }),
    },
  }),
}));

describe("AddApiKey endpoint", () => {
  it("should return a 400 HTTP response on input validation", async () => {
    const request = {
      json: vi.fn(async () => ({ foo: "foo" })),
    } as unknown as NextRequest;

    expect(addApiKey(request)).rejects.toStrictEqual(
      new ParsingError("Failed to parse request body")
    );
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

    expect(addApiKey(request)).rejects.toStrictEqual(
      new ApiKeyAlreadyExistsError("The API key already exists")
    );
  });

  it("should return a 201 HTTP response on success", async () => {
    // getCosmosClient.mockReturnValue({
    //   database: vi.fn().mockReturnValue({
    //     container: vi.fn().mockReturnValue({
    //       items: {
    //         query: vi.fn(() => ({
    //           fetchAll: vi.fn().mockResolvedValue({
    //             resources: [],
    //           }),
    //         })),
    //         create: vi.fn().mockResolvedValue({}),
    //       },
    //     }),
    //   }),
    // });

    const bodyRequest = {
      institutionId: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      displayName: "POLIBA - Dipartimento di Informatica (TEST)",
      environment: "TEST",
      resourceId: "1689092259251",
    };
    const request = {
      json: vi.fn(async () => bodyRequest),
    } as unknown as NextRequest;

    expect(addApiKey(request)).resolves.toEqual({
      id: expect.any(String),
      primaryKey: expect.any(String),
    });
  });
});
