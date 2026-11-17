import { afterEach, describe, expect, it, vi } from "vitest";

import { Database } from "@azure/cosmos";
import { ApiKey } from "@io-sign/io-sign/api-key";

import {
  BackofficeEntitiesRepository,
  getCosmosDBConfigFromEnvironment
} from "../cosmos";

describe("Cosmos authentication configuration", () => {
  afterEach(() => vi.unstubAllEnvs());

  const stubEnvironment = () => {
    vi.stubEnv("COSMOS_DB__accountEndpoint", "https://cosmos.example");
    vi.stubEnv("COSMOS_DB_CONNECTION_STRING", "connection-string");
    vi.stubEnv("COSMOS_DB_NAME", "backoffice");
  };

  it.each(["production", "development", undefined])(
    "uses the explicit flag with NODE_ENV=%s",
    (nodeEnv) => {
      stubEnvironment();
      vi.stubEnv("NODE_ENV", nodeEnv);
      for (const useManagedIdentity of [true, false]) {
        vi.stubEnv("USE_MANAGED_IDENTITY", String(useManagedIdentity));
        expect(getCosmosDBConfigFromEnvironment()).toEqual({
          useManagedIdentity,
          cosmosDbEndpoint: "https://cosmos.example",
          cosmosDbConnectionString: "connection-string",
          cosmosDbName: "backoffice"
        });
      }
    }
  );

  it.each([undefined, "", "TRUE", "1"])(
    "rejects USE_MANAGED_IDENTITY=%s",
    (value) => {
      stubEnvironment();
      vi.stubEnv("USE_MANAGED_IDENTITY", value);
      expect(() => getCosmosDBConfigFromEnvironment()).toThrow(
        "error parsing CosmosDB config"
      );
    }
  );

  it("allows connection-string mode without an endpoint", () => {
    stubEnvironment();
    vi.stubEnv("COSMOS_DB__accountEndpoint", undefined);
    vi.stubEnv("USE_MANAGED_IDENTITY", "false");
    expect(getCosmosDBConfigFromEnvironment()).toEqual({
      useManagedIdentity: false,
      cosmosDbEndpoint: undefined,
      cosmosDbConnectionString: "connection-string",
      cosmosDbName: "backoffice"
    });
  });
});

const apiKey: ApiKey = {
  displayName: "test key",
  cidrs: [],
  testers: [],
  environment: "test",
  institutionId: "3f1c2d9e-8a4b-4c6d-9e2f-1a2b3c4d5e6f",
  status: "active",
  createdAt: new Date(),
  id: "my-api-key"
};

type Resources = Record<string, Record<string, unknown>>;

const makeDatabase = (containers: Resources, failOn?: string) =>
  ({
    container: (name: string) => ({
      item: (id: string) => ({
        read: async () => {
          if (failOn === name) {
            throw new Error("cosmos down");
          }
          return { resource: containers[name]?.[id] };
        }
      })
    })
  }) as unknown as Database;

describe("BackofficeEntitiesRepository.getApiKeyById", () => {
  it("should return undefined when the id is missing in api-keys-by-id", async () => {
    const repository = new BackofficeEntitiesRepository(makeDatabase({}));
    await expect(repository.getApiKeyById("unknown")).resolves.toBeUndefined();
  });

  it("should return undefined when the api key is missing in api-keys", async () => {
    const repository = new BackofficeEntitiesRepository(
      makeDatabase({
        "api-keys-by-id": {
          [apiKey.id]: { institutionId: apiKey.institutionId }
        }
      })
    );
    await expect(repository.getApiKeyById(apiKey.id)).resolves.toBeUndefined();
  });

  it("should return the api key when found", async () => {
    const repository = new BackofficeEntitiesRepository(
      makeDatabase({
        "api-keys-by-id": {
          [apiKey.id]: { institutionId: apiKey.institutionId }
        },
        "api-keys": {
          [apiKey.id]: { ...apiKey, createdAt: apiKey.createdAt.toISOString() }
        }
      })
    );
    await expect(repository.getApiKeyById(apiKey.id)).resolves.toEqual(apiKey);
  });

  it("should throw when Cosmos fails", async () => {
    const repository = new BackofficeEntitiesRepository(
      makeDatabase({}, "api-keys-by-id")
    );
    await expect(repository.getApiKeyById(apiKey.id)).rejects.toThrow(
      "Unable to get the Api Key from DB."
    );
  });
});
