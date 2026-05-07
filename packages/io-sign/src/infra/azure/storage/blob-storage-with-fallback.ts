import { BlobClient } from "@azure/storage-blob";

import * as TE from "fp-ts/lib/TaskEither";

import { constVoid, pipe } from "fp-ts/lib/function";

import { BaseContainerClientWithFallback } from "@pagopa/azure-storage-migration-kit";

import { last } from "fp-ts/lib/ReadonlyNonEmptyArray";
import { split } from "fp-ts/lib/string";
import { toError } from "fp-ts/lib/Either";

import { DocumentReady } from "../../../document";
import {
  defaultBlobGenerateSasUrlOptions,
  withExpireInMinutes,
  withPermissions
} from "./blob";

type FileStorage = {
  exists: (filename: string) => TE.TaskEither<Error, boolean>;
  download: (filename: string) => TE.TaskEither<Error, Buffer>;
  createFromUrl: (
    url: string,
    filename: string
  ) => TE.TaskEither<Error, string>;
  remove: (filename: string) => TE.TaskEither<Error, void>;
  getUrl: (filename: string) => TE.TaskEither<Error, string>;
};

export const copyFromUrl = (source: string) => (blobClient: BlobClient) =>
  pipe(
    TE.tryCatch(
      () =>
        blobClient
          .beginCopyFromURL(source)
          .then((poller) => poller.pollUntilDone()),
      () => new Error("Error on blob copy process")
    ),
    TE.filterOrElse(
      (response) => response.copyStatus === "success",
      (response) =>
        new Error(
          `Unable to copy blob! Current status is ${response.copyStatus}}`
        )
    ),
    TE.map(() => blobClient.url)
  );
// FileStorage backed by a container with read-fallback (migration kit).
// Writes always go to the primary storage account (ITN).
// Reads (exists, download, getUrl) try primary first, falling back to the
// secondary storage account (WEU) when the blob is not yet in ITN.
export class BlobStorageFileStorageWithFallback implements FileStorage {
  #containerClient: BaseContainerClientWithFallback;

  constructor(containerClient: BaseContainerClientWithFallback) {
    this.#containerClient = containerClient;
    this.exists = this.exists.bind(this);
    this.download = this.download.bind(this);
    this.createFromUrl = this.createFromUrl.bind(this);
    this.remove = this.remove.bind(this);
    this.getUrl = this.getUrl.bind(this);
  }

  exists(filename: string) {
    const blobClient = this.#containerClient.getBlobClient(filename);
    return TE.tryCatch(
      () => blobClient.exists(),
      () => new Error("The specified Blob does not exist.")
    );
  }

  download(filename: string) {
    const blobClient = this.#containerClient.getBlobClient(filename);
    return TE.tryCatch(() => blobClient.downloadToBuffer(), toError);
  }

  // Writes to primary (ITN) only.
  createFromUrl(url: string, filename: string) {
    const blobClient = this.#containerClient.getBlobClient(filename);
    return copyFromUrl(url)(blobClient.primaryBlobClient);
  }

  // Deletes from both primary (ITN) and fallback (WEU) if present.
  remove(filename: string) {
    const blobClient = this.#containerClient.getBlobClient(filename);
    return pipe(
      TE.tryCatch(() => blobClient.deleteIfExists(), toError),
      TE.map(constVoid)
    );
  }

  // Generates a SAS URL from primary (ITN) if the blob exists there,
  // otherwise falls back to secondary (WEU).
  getUrl(filename: string) {
    const blobClient = this.#containerClient.getBlobClient(filename);
    const options = pipe(
      defaultBlobGenerateSasUrlOptions(),
      withPermissions("r"),
      withExpireInMinutes(5)
    );
    return TE.tryCatch(
      () => blobClient.generateSasUrl(options),
      () => new Error("Unable to generate the SAS Url for the specified Blob.")
    );
  }
}

// Functional equivalents of toDocumentWithSasUrl / getDocumentUrl
// for containers backed by BaseContainerClientWithFallback.
// Reads try primary (ITN) first, falling back to secondary (WEU)
// when the blob is not yet migrated.
export const toDocumentWithSasUrlWithFallback =
  (permissions: string = "r", expireInMinutes: number = 5) =>
  (document: DocumentReady) =>
  (containerClient: BaseContainerClientWithFallback): TE.TaskEither<Error, DocumentReady> => {
    const blobName = pipe(document.url, split("/"), last);
    const blobClient = containerClient.getBlobClient(blobName);
    const options = pipe(
      defaultBlobGenerateSasUrlOptions(),
      withPermissions(permissions),
      withExpireInMinutes(expireInMinutes)
    );
    return pipe(
      TE.tryCatch(
        () => blobClient.generateSasUrl(options),
        () => new Error("Unable to generate the SAS Url for the specified Blob.")
      ),
      TE.map((url) => ({ ...document, url }))
    );
  };

export const getDocumentUrlWithFallback =
  (permissions: string, expireInMinutes: number) =>
  (document: DocumentReady) =>
  (containerClient: BaseContainerClientWithFallback): TE.TaskEither<Error, string> =>
    pipe(
      toDocumentWithSasUrlWithFallback(permissions, expireInMinutes)(document)(containerClient),
      TE.map((el) => el.url)
    );
