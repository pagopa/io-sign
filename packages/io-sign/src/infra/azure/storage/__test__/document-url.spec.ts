import { describe, it, expect, vi } from "vitest";

import { ContainerClient } from "@azure/storage-blob";

import * as E from "fp-ts/lib/Either";
import { NonEmptyString, WithinRangeString } from "@pagopa/ts-commons/lib/strings";

import { newId } from "../../../../id";
import { DocumentMetadata, DocumentReady } from "../../../../document";

import { toDocumentWithSasUrl, getDocumentUrl } from "../document-url";

const document: DocumentReady = {
  id: newId(),
  status: "READY",
  uploadedAt: new Date(),
  updatedAt: new Date(),
  createdAt: new Date(),
  url: "https://storage.example.com/container/blob-123.pdf",
  metadata: {
    title: "Demo doc",
    signatureFields: [
      {
        attributes: { uniqueName: "field" as NonEmptyString },
        clause: {
          title: "Firma demo",
          type: "REQUIRED"
        }
      }
    ] as DocumentMetadata["signatureFields"],
    pdfDocumentMetadata: {
      pages: [],
      formFields: []
    }
  }
};

const makeContainerClient = (blobClient: object) =>
  ({
    getBlobClient: vi.fn().mockReturnValue(blobClient)
  }) as unknown as ContainerClient;

describe("toDocumentWithSasUrl", () => {
  it("replaces the document url with a generated sas url", async () => {
    const blobClient = {
      exists: vi.fn().mockResolvedValue(true),
      generateSasUrl: vi.fn().mockResolvedValue("https://storage.example.com/sas-url")
    };
    const containerClient = makeContainerClient(blobClient);

    const result = await toDocumentWithSasUrl()(document)(containerClient)();

    expect(containerClient.getBlobClient).toHaveBeenCalledWith(
      "blob-123.pdf"
    );
    expect(result).toStrictEqual(
      E.right({ ...document, url: "https://storage.example.com/sas-url" })
    );
  });

  it("uses the given permissions", async () => {
    const blobClient = {
      exists: vi.fn().mockResolvedValue(true),
      generateSasUrl: vi.fn().mockResolvedValue("https://storage.example.com/sas-url")
    };
    const containerClient = makeContainerClient(blobClient);

    await toDocumentWithSasUrl("rw", 30)(document)(containerClient)();

    const options = blobClient.generateSasUrl.mock.calls[0][0];
    expect(options.permissions.toString()).toBe("rw");
  });

  it("returns Left when the blob existence check rejects (e.g. network error)", async () => {
    const blobClient = {
      exists: vi.fn().mockRejectedValue(new Error("network error")),
      generateSasUrl: vi.fn()
    };
    const containerClient = makeContainerClient(blobClient);

    const result = await toDocumentWithSasUrl()(document)(containerClient)();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toBe(
        "The specified Blob does not exists."
      );
    }
    expect(blobClient.generateSasUrl).not.toHaveBeenCalled();
  });

  it("returns Left when generating the sas url rejects", async () => {
    const blobClient = {
      exists: vi.fn().mockResolvedValue(true),
      generateSasUrl: vi.fn().mockRejectedValue(new Error("error message"))
    };
    const containerClient = makeContainerClient(blobClient);

    const result = await toDocumentWithSasUrl()(document)(containerClient)();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toBe(
        "Unable to generate the SAS Url for the specified Blob."
      );
    }
  });
});

describe("getDocumentUrl", () => {
  it("returns only the generated sas url", async () => {
    const blobClient = {
      exists: vi.fn().mockResolvedValue(true),
      generateSasUrl: vi.fn().mockResolvedValue("https://storage.example.com/sas-url")
    };
    const containerClient = makeContainerClient(blobClient);

    const result = await getDocumentUrl(
      "r",
      5
    )(document)(containerClient)();

    expect(result).toStrictEqual(E.right("https://storage.example.com/sas-url"));
  });
});
