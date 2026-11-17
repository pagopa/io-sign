import { describe, expect, it } from "vitest";
import * as E from "fp-ts/lib/Either";
import { getCosmosAuthConfigFromEnvironment } from "../config";

describe("Cosmos authentication configuration", () => {
  it.each(["production", "development", undefined])(
    "uses managed identity without a connection string with NODE_ENV=%s",
    (nodeEnv) => {
      expect(
        getCosmosAuthConfigFromEnvironment({
          NODE_ENV: nodeEnv,
          USE_MANAGED_IDENTITY: "true",
          COSMOS_DB__accountEndpoint: "https://cosmos.example"
        })
      ).toEqual(
        E.right({
          useManagedIdentity: true,
          endpoint: "https://cosmos.example"
        })
      );
    }
  );

  it("uses the connection string without an endpoint", () => {
    expect(
      getCosmosAuthConfigFromEnvironment({
        USE_MANAGED_IDENTITY: "false",
        CosmosDbConnectionString: "connection-string"
      })
    ).toEqual(
      E.right({
        useManagedIdentity: false,
        connectionString: "connection-string"
      })
    );
  });

  it.each([undefined, ""])(
    "rejects a missing or empty RBAC endpoint: %s",
    (endpoint) => {
      expect(
        E.isLeft(
          getCosmosAuthConfigFromEnvironment({
            USE_MANAGED_IDENTITY: "true",
            COSMOS_DB__accountEndpoint: endpoint,
            CosmosDbConnectionString: "connection-string"
          })
        )
      ).toBe(true);
    }
  );

  it.each([undefined, ""])(
    "rejects a missing or empty local connection string: %s",
    (connectionString) => {
      expect(
        E.isLeft(
          getCosmosAuthConfigFromEnvironment({
            USE_MANAGED_IDENTITY: "false",
            COSMOS_DB__accountEndpoint: "https://cosmos.example",
            CosmosDbConnectionString: connectionString
          })
        )
      ).toBe(true);
    }
  );

  it.each([undefined, "", "TRUE", "1"])(
    "rejects USE_MANAGED_IDENTITY=%s",
    (flag) => {
      expect(
        E.isLeft(
          getCosmosAuthConfigFromEnvironment({
            USE_MANAGED_IDENTITY: flag,
            COSMOS_DB__accountEndpoint: "https://cosmos.example",
            CosmosDbConnectionString: "connection-string"
          })
        )
      ).toBe(true);
    }
  );
});
