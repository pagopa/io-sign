import { last } from "fp-ts/lib/ReadonlyNonEmptyArray";
import { split } from "fp-ts/lib/string";

import { pipe } from "fp-ts/lib/function";

import * as RTE from "fp-ts/ReaderTaskEither";
import { DocumentReady } from "../../../document";

import {
  generateSasUrlFromBlob,
  defaultBlobGenerateSasUrlOptions,
  withExpireInMinutes,
  withPermissions,
  getBlobClient,
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
            withExpireInMinutes(expireInMinutes),
          ),
        ),
      ),
      RTE.map((url) => ({
        ...document,
        url,
      })),
    );

export const getDocumentUrl =
  (permissions: string, expireInMinutes: number) => (document: DocumentReady) =>
    pipe(
      document,
      toDocumentWithSasUrl(permissions, expireInMinutes),
      RTE.map((el) => el.url),
    );
