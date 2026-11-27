import { last } from "fp-ts/lib/ReadonlyNonEmptyArray";
import { split } from "fp-ts/lib/string";

import { pipe } from "fp-ts/lib/function";

import * as RTE from "fp-ts/ReaderTaskEither";
import { DocumentReady } from "../../../document";
import { BlobServiceClient } from "@azure/storage-blob";

import {
  defaultBlobGenerateSasUrlOptions,
  generateSasUrlFromBlob,
  getBlobClient,
  withExpireInMinutes,
  withPermissions
} from "./blob";

export const toDocumentWithSasUrl =
  (
    permissions: string = "r",
    expireInMinutes: number = 5,
    blobServiceClient?: BlobServiceClient
  ) =>
  (document: DocumentReady) =>
    pipe(
      document.url,
      split("/"),
      last,
      getBlobClient,
      RTE.chainTaskEitherK(
        generateSasUrlFromBlob(
          pipe(
            defaultBlobGenerateSasUrlOptions(),
            withPermissions(permissions),
            withExpireInMinutes(expireInMinutes)
          ),
          blobServiceClient
        )
      ),
      RTE.map((url) => ({
        ...document,
        url
      }))
    );

export const getDocumentUrl =
  (
    permissions: string,
    expireInMinutes: number,
    blobServiceClient?: BlobServiceClient
  ) =>
  (document: DocumentReady) =>
    pipe(
      document,
      toDocumentWithSasUrl(permissions, expireInMinutes, blobServiceClient),
      RTE.map((el) => el.url)
    );
