import * as RTE from "fp-ts/ReaderTaskEither";
import { last } from "fp-ts/lib/ReadonlyNonEmptyArray";
import { pipe } from "fp-ts/lib/function";
import { split } from "fp-ts/lib/string";

import { DocumentReady } from "../../../document";
import {
  defaultBlobGenerateSasUrlOptions,
  generateSasUrlFromBlob,
  getBlobClient,
  withExpireInMinutes,
  withPermissions
} from "./blob";

export const toDocumentWithSasUrl =
  (permissions: string = "r", expireInMinutes: number = 5) =>
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
          )
        )
      ),
      RTE.map((url) => ({
        ...document,
        url
      }))
    );

export const getDocumentUrl =
  (permissions: string, expireInMinutes: number) => (document: DocumentReady) =>
    pipe(
      document,
      toDocumentWithSasUrl(permissions, expireInMinutes),
      RTE.map((el) => el.url)
    );
