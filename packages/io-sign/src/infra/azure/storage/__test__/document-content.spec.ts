import { describe, it, expect, vi } from "vitest";

import { ContainerClient } from "@azure/storage-blob";

import * as E from "fp-ts/lib/Either";
import { NonEmptyString, WithinRangeString } from "@pagopa/ts-commons/lib/strings";

import { newId } from "../../../../id";
import { DocumentMetadata, DocumentReady } from "../../../../document";

import { getDocumentContent } from "../document-content";

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

describe("getDocumentContent", () => {
  it("downloads the content of the blob referenced by the document url", async () => {
    const buffer = Buffer.from("content");
    const blobClient = {
      exists: vi.fn().mockResolvedValue(true),
      downloadToBuffer: vi.fn().mockResolvedValue(buffer)
    };
    const containerClient = {
      getBlobClient: vi.fn().mockReturnValue(blobClient)
    } as unknown as ContainerClient;

    const result = await getDocumentContent(document)(containerClient)();

    expect(containerClient.getBlobClient).toHaveBeenCalledWith(
      "blob-123.pdf"
    );
    expect(result).toStrictEqual(E.right(buffer));
  });

  it("returns Left when the blob existence check rejects (e.g. network error)", async () => {
    const blobClient = {
      exists: vi.fn().mockRejectedValue(new Error("network error")),
      downloadToBuffer: vi.fn()
    };
    const containerClient = {
      getBlobClient: vi.fn().mockReturnValue(blobClient)
    } as unknown as ContainerClient;

    const result = await getDocumentContent(document)(containerClient)();

    expect(E.isLeft(result)).toBe(true);
    expect(blobClient.downloadToBuffer).not.toHaveBeenCalled();
  });

  it("returns Left when downloading the content rejects", async () => {
    const blobClient = {
      exists: vi.fn().mockResolvedValue(true),
      downloadToBuffer: vi.fn().mockRejectedValue(new Error("error message"))
    };
    const containerClient = {
      getBlobClient: vi.fn().mockReturnValue(blobClient)
    } as unknown as ContainerClient;

    const result = await getDocumentContent(document)(containerClient)();

    expect(E.isLeft(result)).toBe(true);
  });
});
