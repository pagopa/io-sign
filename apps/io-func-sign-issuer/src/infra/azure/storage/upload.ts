import { BlobClient, ContainerClient } from "@azure/storage-blob";

import * as TE from "fp-ts/lib/TaskEither";

import { pipe } from "fp-ts/lib/function";

import { validate } from "@io-sign/io-sign/validation";
import { toError } from "fp-ts/lib/Either";

import {
  defaultBlobGenerateSasUrlOptions,
  withPermissions,
  withExpireInMinutes,
  generateSasUrlFromBlob,
  blobExists,
} from "@io-sign/io-sign/infra/azure/storage/blob";
import {
  DeleteUploadDocument,
  DownloadUploadDocument,
  GetUploadUrl,
  IsUploaded,
  MoveUploadedDocument,
  UploadUrl,
} from "../../../upload";

const deleteBlobIfExists = (blobClient: BlobClient) =>
  pipe(
    TE.tryCatch(
      () => blobClient.deleteIfExists(),
      () => new Error("Unable to delete the blob.")
    ),
    TE.filterOrElse(
      (response) => response.succeeded === true,
      () => new Error("The specified blob does not exists.")
    ),
    TE.map(() => blobClient.name) // TODO: quale è lo scopo?
  );

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

export const makeGetUploadUrl =
  (containerClient: ContainerClient): GetUploadUrl =>
  (metadata) =>
    pipe(
      containerClient.getBlobClient(metadata.id),
      generateSasUrlFromBlob(
        pipe(
          defaultBlobGenerateSasUrlOptions(),
          withPermissions("racw"),
          withExpireInMinutes(15)
        )
      ),
      TE.chainEitherKW(validate(UploadUrl, "Invalid SAS Url generated."))
    );

export const makeIsUploaded =
  (containerClient: ContainerClient): IsUploaded =>
  (id) =>
    pipe(containerClient.getBlobClient(id), blobExists);

export const makeDeleteUploadedMetadata =
  (containerClient: ContainerClient): DeleteUploadDocument =>
  (id) =>
    pipe(containerClient.getBlobClient(id), deleteBlobIfExists);

export const makeMoveUploadedDocument =
  (containerClient: ContainerClient): MoveUploadedDocument =>
  (documentId) =>
  (source) =>
    pipe(containerClient.getBlobClient(documentId), copyFromUrl(source));

export const makeDownloadUploadedDocument =
  (containerClient: ContainerClient): DownloadUploadDocument =>
  (id) =>
    pipe(containerClient.getBlobClient(id), (blob) =>
      TE.tryCatch(() => blob.downloadToBuffer(), toError)
    );
