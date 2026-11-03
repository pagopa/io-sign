import { describe, expect, it } from "vitest";

import { Database } from "@azure/cosmos";
import { ApiKey } from "@io-sign/io-sign/api-key";

import { BackofficeEntitiesRepository } from "../cosmos";

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
