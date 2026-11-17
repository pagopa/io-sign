import { describe, expect, it } from "vitest";
import * as E from "fp-ts/lib/Either";
import { getCosmosConfigFromEnvironment } from "../config";

const environment = {
  COSMOS_DB__accountEndpoint: "https://cosmos.example",
  CosmosDbConnectionString: "connection-string",
  CosmosDbDatabaseName: "user"
};

describe("Cosmos authentication configuration", () => {
  it.each(["production", "development", undefined])(
    "uses the explicit flag with NODE_ENV=%s",
    (nodeEnv) => {
      for (const useManagedIdentity of [true, false]) {
        expect(
          getCosmosConfigFromEnvironment({
            ...environment,
            NODE_ENV: nodeEnv,
            USE_MANAGED_IDENTITY: String(useManagedIdentity)
          })
        ).toEqual(
          E.right({
            useManagedIdentity,
            ...(useManagedIdentity
              ? { endpoint: environment.COSMOS_DB__accountEndpoint }
              : { connectionString: environment.CosmosDbConnectionString }),
            dbName: environment.CosmosDbDatabaseName
          })
        );
      }
    }
  );

  it.each([undefined, "", "TRUE", "1"])(
    "rejects USE_MANAGED_IDENTITY=%s",
    (value) => {
      expect(
        E.isLeft(
          getCosmosConfigFromEnvironment({
            ...environment,
            USE_MANAGED_IDENTITY: value
          })
        )
      ).toBe(true);
    }
  );

  it("allows connection-string mode without an endpoint", () => {
    expect(
      getCosmosConfigFromEnvironment({
        ...environment,
        COSMOS_DB__accountEndpoint: undefined,
        USE_MANAGED_IDENTITY: "false"
      })
    ).toEqual(
      E.right({
        useManagedIdentity: false,
        connectionString: environment.CosmosDbConnectionString,
        dbName: environment.CosmosDbDatabaseName
      })
    );
  });

  it("allows managed identity without a connection string", () => {
    expect(
      getCosmosConfigFromEnvironment({
        ...environment,
        CosmosDbConnectionString: undefined,
        USE_MANAGED_IDENTITY: "true"
      })
    ).toEqual(
      E.right({
        useManagedIdentity: true,
        endpoint: environment.COSMOS_DB__accountEndpoint,
        dbName: environment.CosmosDbDatabaseName
      })
    );
  });
});
