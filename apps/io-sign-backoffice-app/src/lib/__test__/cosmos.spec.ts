import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cosmos: vi.fn(),
  credential: vi.fn(),
  database: vi.fn(),
  container: vi.fn(),
}));

vi.mock("@azure/cosmos", () => ({ CosmosClient: mocks.cosmos }));
vi.mock("@azure/identity", () => ({
  DefaultAzureCredential: mocks.credential,
}));
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));

describe("Cosmos authentication", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.cosmos.mockImplementation(() => ({ database: mocks.database }));
    mocks.credential.mockImplementation(() => ({}));
    mocks.database.mockReturnValue({ container: mocks.container });
    vi.stubEnv("COSMOS_DB_NAME", "backoffice");
    vi.stubEnv("COSMOS_DB__accountEndpoint", undefined);
    vi.stubEnv("COSMOS_DB_CONNECTION_STRING", undefined);
    vi.stubEnv("USE_MANAGED_IDENTITY", undefined);
  });

  afterEach(() => vi.unstubAllEnvs());

  it.each(["production", "development", undefined])(
    "uses managed identity with NODE_ENV=%s",
    async (nodeEnv) => {
      vi.stubEnv("NODE_ENV", nodeEnv);
      vi.stubEnv("USE_MANAGED_IDENTITY", "true");
      vi.stubEnv("COSMOS_DB__accountEndpoint", "https://cosmos.example");
      const { getCosmosContainerClient } = await import("../cosmos");

      getCosmosContainerClient("issuers");
      getCosmosContainerClient("api-keys");

      expect(mocks.cosmos).toHaveBeenCalledExactlyOnceWith({
        endpoint: "https://cosmos.example",
        aadCredentials: expect.any(Object),
      });
      expect(mocks.credential).toHaveBeenCalledTimes(1);
      expect(mocks.database).toHaveBeenCalledWith("backoffice");
      expect(mocks.container).toHaveBeenCalledWith("issuers");
      expect(mocks.container).toHaveBeenCalledWith("api-keys");
    },
  );

  it.each(["production", "development", undefined])(
    "uses the connection string with NODE_ENV=%s",
    async (nodeEnv) => {
      vi.stubEnv("NODE_ENV", nodeEnv);
      vi.stubEnv("USE_MANAGED_IDENTITY", "false");
      vi.stubEnv("COSMOS_DB_CONNECTION_STRING", "connection-string");
      const { getCosmosContainerClient } = await import("../cosmos");

      getCosmosContainerClient("issuers");

      expect(mocks.cosmos).toHaveBeenCalledExactlyOnceWith("connection-string");
      expect(mocks.credential).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, "", "TRUE", "1", "rbac", "connection-string"])(
    "rejects USE_MANAGED_IDENTITY=%s",
    async (flag) => {
      vi.stubEnv("USE_MANAGED_IDENTITY", flag);
      vi.stubEnv("COSMOS_DB__accountEndpoint", "https://cosmos.example");
      vi.stubEnv("COSMOS_DB_CONNECTION_STRING", "connection-string");
      const { getCosmosContainerClient } = await import("../cosmos");

      expect(() => getCosmosContainerClient("issuers")).toThrow(
        "error parsing cosmos config",
      );
      expect(mocks.cosmos).not.toHaveBeenCalled();
    },
  );

  it.each(["true", "false"])(
    "requires the credentials for USE_MANAGED_IDENTITY=%s",
    async (flag) => {
      vi.stubEnv("USE_MANAGED_IDENTITY", flag);
      const { getCosmosContainerClient } = await import("../cosmos");

      expect(() => getCosmosContainerClient("issuers")).toThrow(
        "error parsing cosmos config",
      );
      expect(mocks.cosmos).not.toHaveBeenCalled();
    },
  );
});
