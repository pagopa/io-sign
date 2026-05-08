import * as TE from "fp-ts/lib/TaskEither";

import { pipe } from "fp-ts/lib/function";

import { BaseContainerClientWithFallback } from "@pagopa/azure-storage-migration-kit";

import { last } from "fp-ts/lib/ReadonlyNonEmptyArray";
import { split } from "fp-ts/lib/string";

import { DocumentReady } from "../../../document";
import {
  defaultBlobGenerateSasUrlOptions,
  withExpireInMinutes,
  withPermissions
} from "./blob";

// Functional equivalents of toDocumentWithSasUrl / getDocumentUrl
// for containers backed by BaseContainerClientWithFallback.
// Reads try primary (ITN) first, falling back to secondary (WEU)
// when the blob is not yet migrated.
export const toDocumentWithSasUrlWithFallback =
  (permissions: string = "r", expireInMinutes: number = 5) =>
  (document: DocumentReady) =>
  (
    containerClient: BaseContainerClientWithFallback
  ): TE.TaskEither<Error, DocumentReady> => {
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
        () =>
          new Error("Unable to generate the SAS Url for the specified Blob.")
      ),
      TE.map((url) => ({ ...document, url }))
    );
  };

export const getDocumentUrlWithFallback =
  (permissions: string, expireInMinutes: number) =>
  (document: DocumentReady) =>
  (
    containerClient: BaseContainerClientWithFallback
  ): TE.TaskEither<Error, string> =>
    pipe(
      toDocumentWithSasUrlWithFallback(permissions, expireInMinutes)(document)(
        containerClient
      ),
      TE.map((el) => el.url)
    );
