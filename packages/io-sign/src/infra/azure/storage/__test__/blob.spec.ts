import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  BlobClient,
  BlobGenerateSasUrlOptions,
  ContainerClient,
  SASProtocol
} from "@azure/storage-blob";

import * as E from "fp-ts/lib/Either";

import {
  blobExists,
  getBlobClient,
  defaultBlobGenerateSasUrlOptions,
  withPermissions,
  withExpireInMinutes,
  generateSasUrlFromBlob,
  downloadContentFromBlob,
  deleteBlobIfExist
} from "../blob";

const now = new Date("2026-01-01T10:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("blobExists", () => {
  it("returns Right(true) when the blob exists", async () => {
    const blobClient = { exists: vi.fn().mockResolvedValue(true) } as unknown as BlobClient;

    const result = await blobExists(blobClient)();

    expect(result).toStrictEqual(E.right(true));
  });

  it("returns Right(false) when the blob does not exist", async () => {
    const blobClient = { exists: vi.fn().mockResolvedValue(false) } as unknown as BlobClient;

    const result = await blobExists(blobClient)();

    expect(result).toStrictEqual(E.right(false));
  });

  it("returns Left when checking existence rejects", async () => {
    const blobClient = {
      exists: vi.fn().mockRejectedValue(new Error("network error"))
    } as unknown as BlobClient;

    const result = await blobExists(blobClient)();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toBe("The specified Blob does not exists.");
    }
  });
});

describe("getBlobClient", () => {
  it("returns the blob client for the given name when it exists", async () => {
    const blobClient = { exists: vi.fn().mockResolvedValue(true) };
    const containerClient = {
      getBlobClient: vi.fn().mockReturnValue(blobClient)
    } as unknown as ContainerClient;

    const result = await getBlobClient("blobName")(containerClient)();

    expect(containerClient.getBlobClient).toHaveBeenCalledWith("blobName");
    expect(result).toStrictEqual(E.right(blobClient));
  });

  it("still returns the blob client when the supplied blob does not exist", async () => {
    const blobClient = { exists: vi.fn().mockResolvedValue(false) };
    const containerClient = {
      getBlobClient: vi.fn().mockReturnValue(blobClient)
    } as unknown as ContainerClient;

    const result = await getBlobClient("blobName")(containerClient)();

    expect(result).toStrictEqual(E.right(blobClient));
  });

  it("returns Left when the blob existence check rejects (e.g. network error)", async () => {
    const blobClient = {
      exists: vi.fn().mockRejectedValue(new Error("network error"))
    };
    const containerClient = {
      getBlobClient: vi.fn().mockReturnValue(blobClient)
    } as unknown as ContainerClient;

    const result = await getBlobClient("blobName")(containerClient)();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toBe("The specified Blob does not exists.");
    }
  });
});

describe("defaultBlobGenerateSasUrlOptions", () => {
  it("returns the default sas url options", () => {
    expect(defaultBlobGenerateSasUrlOptions()).toStrictEqual({
      contentType: "application/pdf",
      protocol: SASProtocol.HttpsAndHttp
    });
  });
});

describe("withPermissions", () => {
  it("adds the parsed permissions to the given options", () => {
    const options = defaultBlobGenerateSasUrlOptions();

    const result = withPermissions("r")(options);

    expect(result.permissions?.toString()).toBe("r");
    expect(result.contentType).toBe("application/pdf");
  });
});

describe("withExpireInMinutes", () => {
  it("sets startsOn to now and expiresOn N minutes from now", () => {
    const options = defaultBlobGenerateSasUrlOptions();

    const result = withExpireInMinutes(5)(options);

    expect(result.startsOn).toStrictEqual(now);
    expect(result.expiresOn).toStrictEqual(new Date("2026-01-01T10:05:00.000Z"));
  });
});

describe("generateSasUrlFromBlob", () => {
  const options: BlobGenerateSasUrlOptions = defaultBlobGenerateSasUrlOptions();

  it("returns Right with the generated sas url", async () => {
    const blobClient = {
      generateSasUrl: vi.fn().mockResolvedValue("https://storage.example.com/sas-url")
    } as unknown as BlobClient;

    const result = await generateSasUrlFromBlob(options)(blobClient)();

    expect(blobClient.generateSasUrl).toHaveBeenCalledWith(options);
    expect(result).toStrictEqual(E.right("https://storage.example.com/sas-url"));
  });

  it("returns Left when generating the sas url rejects", async () => {
    const blobClient = {
      generateSasUrl: vi.fn().mockRejectedValue(new Error("error message"))
    } as unknown as BlobClient;

    const result = await generateSasUrlFromBlob(options)(blobClient)();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toBe(
        "Unable to generate the SAS Url for the specified Blob."
      );
    }
  });
});

describe("downloadContentFromBlob", () => {
  it("returns Right with the downloaded buffer", async () => {
    const buffer = Buffer.from("content");
    const blobClient = {
      downloadToBuffer: vi.fn().mockResolvedValue(buffer)
    } as unknown as BlobClient;

    const result = await downloadContentFromBlob(blobClient)();

    expect(result).toStrictEqual(E.right(buffer));
  });

  it("returns Left when downloading rejects", async () => {
    const blobClient = {
      downloadToBuffer: vi.fn().mockRejectedValue(new Error("error message"))
    } as unknown as BlobClient;

    const result = await downloadContentFromBlob(blobClient)();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toBe(
        "Unable to download content for the specified Blob."
      );
    }
  });
});

describe("deleteBlobIfExist", () => {
  it("returns Right with the blob client when deletion succeeds", async () => {
    const blobClient = {
      deleteIfExists: vi.fn().mockResolvedValue({ succeeded: true })
    } as unknown as BlobClient;

    const result = await deleteBlobIfExist(blobClient)();

    expect(result).toStrictEqual(E.right(blobClient));
  });

  it("returns Left when the blob did not exist", async () => {
    const blobClient = {
      deleteIfExists: vi.fn().mockResolvedValue({ succeeded: false })
    } as unknown as BlobClient;

    const result = await deleteBlobIfExist(blobClient)();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toBe("The specified blob does not exists.");
    }
  });

  it("returns Left when deletion rejects", async () => {
    const blobClient = {
      deleteIfExists: vi.fn().mockRejectedValue(new Error("error message"))
    } as unknown as BlobClient;

    const result = await deleteBlobIfExist(blobClient)();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toBe("Unable to delete the blob.");
    }
  });
});
