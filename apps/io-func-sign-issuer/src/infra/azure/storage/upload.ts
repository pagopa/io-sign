import { BlobClient, ContainerClient } from "@azure/storage-blob";

import * as TE from "fp-ts/lib/TaskEither";

import { constVoid, pipe } from "fp-ts/lib/function";

import { validate } from "@io-sign/io-sign/validation";
import { toError } from "fp-ts/lib/Either";

import {
  defaultBlobGenerateSasUrlOptions,
  withPermissions,
  withExpireInMinutes,
  generateSasUrlFromBlob,
  blobExists,
  deleteBlobIfExist,
} from "@io-sign/io-sign/infra/azure/storage/blob";

import { GetUploadUrl, UploadUrl } from "../../../upload";

import { FileStorage } from "../../../upload";

export const copyFromUrl = (source: string) => (blobClient: BlobClient) =>
  pipe(
    TE.tryCatch(
      () =>
        blobClient
          .beginCopyFromURL(source)
          .then((poller) => poller.pollUntilDone()),
      () => new Error("Error on blob copy process"),
    ),
    TE.filterOrElse(
      (response) => response.copyStatus === "success",
      (response) =>
        new Error(
          `Unable to copy blob! Current status is ${response.copyStatus}}`,
        ),
    ),
    TE.map(() => blobClient.url),
  );
export class BlobStorageFileStorage implements FileStorage {
  #containerClient: ContainerClient;

  constructor(containerClient: ContainerClient) {
    this.#containerClient = containerClient;
    this.exists = this.exists.bind(this);
    this.download = this.download.bind(this);
    this.createFromUrl = this.createFromUrl.bind(this);
    this.remove = this.remove.bind(this);
  }

  exists(filename: string) {
    const blobClient = this.#containerClient.getBlobClient(filename);
    return blobExists(blobClient);
  }

  download(filename: string) {
    const blobClient = this.#containerClient.getBlobClient(filename);
    return pipe(TE.tryCatch(() => blobClient.downloadToBuffer(), toError));
  }

  createFromUrl(url: string, filename: string) {
    const blobClient = this.#containerClient.getBlobClient(filename);
    return copyFromUrl(url)(blobClient);
  }

  remove(filename: string) {
    const blobClient = this.#containerClient.getBlobClient(filename);
    return pipe(deleteBlobIfExist(blobClient), TE.map(constVoid));
  }

  getUrl(filename: string) {
    const blobClient = this.#containerClient.getBlobClient(filename);
    return blobClient.url;
  }
}

export const makeGetUploadUrl =
  (containerClient: ContainerClient): GetUploadUrl =>
  (metadata) =>
    pipe(
      containerClient.getBlobClient(metadata.id),
      generateSasUrlFromBlob(
        pipe(
          defaultBlobGenerateSasUrlOptions(),
          withPermissions("racw"),
          withExpireInMinutes(15),
        ),
      ),
      TE.chainEitherKW(validate(UploadUrl, "Invalid SAS Url generated.")),
    );
