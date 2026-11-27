import { afterEach, describe, expect, it, vi } from "vitest";
import { getSignEventWebhookQueuePublisherConfigFromEnvironment } from "../config.js";

describe("webhook queue authentication", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts managed identity without a connection string", () => {
    vi.stubEnv("USE_STORAGE_MANAGED_IDENTITY", "true");
    vi.stubEnv(
      "SIGN_STORAGE__queueServiceUri",
      "https://account.queue.core.windows.net/"
    );
    vi.stubEnv("StorageAccountItnConnectionString", undefined);
    expect(getSignEventWebhookQueuePublisherConfigFromEnvironment()).toEqual({
      useManagedIdentity: true,
      queueServiceUri: "https://account.queue.core.windows.net/"
    });
  });

  it("accepts a connection string without an endpoint", () => {
    vi.stubEnv("USE_STORAGE_MANAGED_IDENTITY", "false");
    vi.stubEnv("SIGN_STORAGE__queueServiceUri", undefined);
    vi.stubEnv(
      "StorageAccountItnConnectionString",
      "UseDevelopmentStorage=true"
    );
    expect(getSignEventWebhookQueuePublisherConfigFromEnvironment()).toEqual({
      useManagedIdentity: false,
      connectionString: "UseDevelopmentStorage=true"
    });
  });

  it.each([
    ["true", undefined, "connection-string"],
    ["true", "", "connection-string"],
    ["false", "https://account.queue.core.windows.net/", undefined],
    ["false", "https://account.queue.core.windows.net/", ""],
    [undefined, "https://account.queue.core.windows.net/", "connection-string"]
  ])(
    "rejects missing credentials or an invalid mode",
    (mode, endpoint, connectionString) => {
      vi.stubEnv("USE_STORAGE_MANAGED_IDENTITY", mode);
      vi.stubEnv("SIGN_STORAGE__queueServiceUri", endpoint);
      vi.stubEnv("StorageAccountItnConnectionString", connectionString);
      expect(() =>
        getSignEventWebhookQueuePublisherConfigFromEnvironment()
      ).toThrow("error parsing SignEventWebhookQueuePublisher config");
    }
  );
});
