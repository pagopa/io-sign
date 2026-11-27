import { describe, expect, it } from "vitest";
import * as E from "fp-ts/lib/Either";
import { getStorageConfigFromEnvironment } from "../config";

describe("storage authentication configuration", () => {
  it("uses a connection string without service endpoints", () => {
    expect(
      getStorageConfigFromEnvironment({
        USE_STORAGE_MANAGED_IDENTITY: "false",
        StorageAccountItnConnectionString: "UseDevelopmentStorage=true"
      })
    ).toEqual(
      E.right({
        useManagedIdentity: false,
        connectionString: "UseDevelopmentStorage=true"
      })
    );
  });

  it("uses managed identity without a connection string", () => {
    expect(
      getStorageConfigFromEnvironment({
        USE_STORAGE_MANAGED_IDENTITY: "true",
        SIGN_STORAGE__blobServiceUri: "https://account.blob.core.windows.net/",
        SIGN_STORAGE__queueServiceUri: "https://account.queue.core.windows.net/"
      })
    ).toEqual(
      E.right({
        useManagedIdentity: true,
        blobServiceUri: "https://account.blob.core.windows.net/",
        queueServiceUri: "https://account.queue.core.windows.net/"
      })
    );
  });

  it.each([undefined, "", "TRUE", "1"])("rejects invalid mode %s", (mode) => {
    expect(
      E.isLeft(
        getStorageConfigFromEnvironment({ USE_STORAGE_MANAGED_IDENTITY: mode })
      )
    ).toBe(true);
  });

  it.each(["SIGN_STORAGE__blobServiceUri", "SIGN_STORAGE__queueServiceUri"])(
    "requires a non-empty %s in managed identity mode",
    (missing) => {
      for (const value of [undefined, ""]) {
        expect(
          E.isLeft(
            getStorageConfigFromEnvironment({
              USE_STORAGE_MANAGED_IDENTITY: "true",
              SIGN_STORAGE__blobServiceUri:
                "https://account.blob.core.windows.net/",
              SIGN_STORAGE__queueServiceUri:
                "https://account.queue.core.windows.net/",
              [missing]: value
            })
          )
        ).toBe(true);
      }
    }
  );

  it.each([undefined, ""])(
    "requires a local connection string: %s",
    (connectionString) => {
      expect(
        E.isLeft(
          getStorageConfigFromEnvironment({
            USE_STORAGE_MANAGED_IDENTITY: "false",
            StorageAccountItnConnectionString: connectionString
          })
        )
      ).toBe(true);
    }
  );
});
