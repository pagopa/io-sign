import { describe, expect, it } from "vitest";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { makeStorageClients } from "../client";

describe("storage clients", () => {
  it("uses the connection string and legacy binding locally", () => {
    const clients = makeStorageClients({
      useManagedIdentity: false,
      connectionString: "UseDevelopmentStorage=true" as NonEmptyString
    });
    expect(clients.binding).toBe("StorageAccountItnConnectionString");
    expect(clients.blobService.url).toContain("127.0.0.1:10000");
    expect(clients.queueService.url).toContain("127.0.0.1:10001");
    expect(clients.blobServiceClient).toBeUndefined();
  });

  it("uses identity endpoints and binding for Azure", () => {
    const credential = {
      getToken: async () => ({
        token: "test",
        expiresOnTimestamp: Date.now() + 60000
      })
    };
    const clients = makeStorageClients(
      {
        useManagedIdentity: true,
        blobServiceUri:
          "https://account.blob.core.windows.net/" as NonEmptyString,
        queueServiceUri:
          "https://account.queue.core.windows.net/" as NonEmptyString
      },
      credential
    );
    expect(clients.binding).toBe("SIGN_STORAGE");
    expect(clients.blobService.url).toBe(
      "https://account.blob.core.windows.net/"
    );
    expect(clients.queueService.url).toBe(
      "https://account.queue.core.windows.net/"
    );
    expect(clients.blobServiceClient).toBe(clients.blobService);
  });

  it("rejects managed identity without credentials", () => {
    expect(() =>
      makeStorageClients({
        useManagedIdentity: true,
        blobServiceUri:
          "https://account.blob.core.windows.net/" as NonEmptyString,
        queueServiceUri:
          "https://account.queue.core.windows.net/" as NonEmptyString
      })
    ).toThrow("A credential is required for managed identity storage");
  });
});
