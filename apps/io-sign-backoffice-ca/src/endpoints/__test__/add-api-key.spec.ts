import { NextRequest } from "next/server";
import { ParsingError } from "@/error";
import { addApiKey } from "../add-api-key";
import { ApiKeyAlreadyExistsError } from "@/api-key";

jest.mock("@/infra/azure/cosmos/config", () => ({
  getCosmosConfigFromEnvironment: jest.fn().mockReturnValue({
    accountEndpoint: "accountEndpoint",
    accountKey: "accountKey",
    dbName: "dbName",
    containerName: "containerName",
  }),
}));
jest.mock("@/infra/azure/cosmos/client", () => ({
  getCosmosClient: jest.fn().mockReturnValue({
    database: jest.fn().mockReturnValue({
      container: jest.fn().mockReturnValue({
        items: {
          query: jest.fn(() => ({
            fetchAll: jest.fn().mockResolvedValue({
              resources: [], // mocks.apiKeys,
            }),
          })),
          create: jest.fn().mockResolvedValue({}),
        },
      }),
    }),
  }),
}));
jest.mock("@/infra/azure/api-management/config", () => ({
  getApimConfigFromEnvironment: jest.fn().mockReturnValue({
    subscriptionId: "subscriptionId",
    resourceGroupName: "resourceGroupName",
    serviceName: "serviceName",
    productName: "productName",
  }),
  getApimClient: jest.fn().mockReturnValue({
    subscription: {
      createOrUpdate: jest.fn().mockResolvedValue({
        primaryKey: "foo",
      }),
    },
  }),
}));
jest.mock("@/infra/azure/api-management/client", () => ({
  getApimClient: jest.fn().mockReturnValue({
    subscription: {
      createOrUpdate: jest.fn().mockResolvedValue({
        primaryKey: "foo",
      }),
    },
  }),
}));

describe("AddApiKey endpoint", () => {
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

  it.skip("should return a 409 HTTP response on input body conflict", async () => {
    // these institutionId, displayName and environment are already present in the mocked API keys
    const bodyRequest = {
      institutionId: "a0e07d4a-9792-4af3-8175-889aead727b8",
      displayName: "Comune di Cori - Anagrafe - Lorem Ipsum",
      environment: "DEFAULT",
      resourceId: "1689092259251",
    };
    const request = {
      json: jest.fn(async () => bodyRequest),
    } as unknown as NextRequest;

    expect(addApiKey(request)).rejects.toStrictEqual(
      new ApiKeyAlreadyExistsError("The API key already exists")
    );
  });

  it("should return a 201 HTTP response on success", async () => {
    // mocks.apiKeys = [];
    // these institutionId, displayName and environment are not present in the mocked API keys
    const bodyRequest = {
      institutionId: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      displayName: "POLIBA - Dipartimento di Informatica (TEST)",
      environment: "TEST",
      resourceId: "1689092259251",
    };
    const request = {
      json: jest.fn(async () => bodyRequest),
    } as unknown as NextRequest;

    expect(addApiKey(request)).resolves.toEqual({
      id: expect.any(String),
      primaryKey: expect.any(String),
    });
  });

  it("should return a 400 HTTP response on input validation", async () => {
    const request = {
      json: jest.fn(async () => ({ foo: "foo" })),
    } as unknown as NextRequest;

    expect(addApiKey(request)).rejects.toStrictEqual(
      new ParsingError("Failed to parse request body")
    );
  });
});
