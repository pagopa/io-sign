import {
  BlobGenerateSasUrlOptions,
  BlobSASPermissions,
  SASProtocol,
  BlobClient,
  ContainerClient,
} from "@azure/storage-blob";

import * as R from "fp-ts/lib/Reader";
import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { pipe } from "fp-ts/lib/function";

import { addMinutes } from "date-fns";

export const blobExists = (blobClient: BlobClient) =>
  TE.tryCatch(
    () => blobClient.exists(),
    () => new Error("The specified Blob does not exists.")
  );

export const getBlobClient = (blobName: string) =>
  pipe(
    RTE.ask<ContainerClient>(),
    RTE.map((containerClient) => containerClient.getBlobClient(blobName)),
    RTE.chainFirstTaskEitherK(blobExists)
  );

export const defaultBlobGenerateSasUrlOptions =
  (): BlobGenerateSasUrlOptions => ({
    contentType: "application/pdf",
    protocol: SASProtocol.HttpsAndHttp,
  });

export const withPermissions = (permissions: string) =>
  pipe(
    R.ask<BlobGenerateSasUrlOptions>(),
    R.map((options) => ({
      ...options,
      permissions: BlobSASPermissions.parse(permissions),
    }))
  );

export const withExpireInMinutes = (minutes: number) =>
  pipe(
    R.ask<BlobGenerateSasUrlOptions>(),
    R.map((options) => ({
      ...options,
      startsOn: new Date(),
      expiresOn: addMinutes(new Date(), minutes),
    }))
  );

export const generateSasUrlFromBlob = (options: BlobGenerateSasUrlOptions) =>
  pipe(
    RTE.ask<BlobClient>(),
    RTE.chainTaskEitherK((blobClient) =>
      TE.tryCatch(
        () => blobClient.generateSasUrl(options),
        () =>
          new Error("Unable to generate the SAS Url for the specified Blob.")
      )
    )
  );

export const downloadContentFromBlob = pipe(
  RTE.ask<BlobClient>(),
  RTE.chainTaskEitherK((blobClient) =>
    TE.tryCatch(
      () => blobClient.downloadToBuffer(),
      () => new Error("Unable to download content for the specified Blob.")
    )
  )
);
