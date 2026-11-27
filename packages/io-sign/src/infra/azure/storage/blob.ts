import {
  BlobClient,
  BlobGenerateSasUrlOptions,
  BlobSASPermissions,
  BlobServiceClient,
  ContainerClient,
  SASProtocol
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
    protocol: SASProtocol.HttpsAndHttp
  });

export const withPermissions = (permissions: string) =>
  pipe(
    R.ask<BlobGenerateSasUrlOptions>(),
    R.map((options) => ({
      ...options,
      permissions: BlobSASPermissions.parse(permissions)
    }))
  );

export const withExpireInMinutes = (minutes: number) =>
  pipe(
    R.ask<BlobGenerateSasUrlOptions>(),
    R.map((options) => ({
      ...options,
      startsOn: new Date(),
      expiresOn: addMinutes(new Date(), minutes)
    }))
  );

export const generateSasUrlFromBlob = (
  options: BlobGenerateSasUrlOptions,
  blobServiceClient?: BlobServiceClient
) =>
  pipe(
    RTE.ask<BlobClient>(),
    RTE.chainTaskEitherK((blobClient) =>
      TE.tryCatch(
        async () => {
          if (!blobServiceClient) {
            return blobClient.generateSasUrl(options);
          }
          if (!options.startsOn || !options.expiresOn) {
            throw new Error(
              "A start and expiry time are required for a user delegation SAS"
            );
          }
          const key = await blobServiceClient.getUserDelegationKey(
            options.startsOn,
            options.expiresOn
          );
          return blobClient.generateUserDelegationSasUrl(options, key);
        },
        (cause) =>
          new Error("Unable to generate the SAS Url for the specified Blob.", {
            cause
          })
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

export const deleteBlobIfExist = pipe(
  RTE.ask<BlobClient>(),
  RTE.chainTaskEitherK((blobClient) =>
    pipe(
      TE.tryCatch(
        () => blobClient.deleteIfExists(),
        () => new Error("Unable to delete the blob.")
      ),
      TE.filterOrElse(
        (response) => response.succeeded === true,
        () => new Error("The specified blob does not exists.")
      ),
      TE.map(() => blobClient)
    )
  )
);
