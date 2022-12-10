import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { pipe } from "fp-ts/lib/function";

import { last } from "fp-ts/lib/ReadonlyNonEmptyArray";

import { split } from "fp-ts/lib/string";

import { DocumentReady } from "@io-sign/io-sign/document";

import {
  generateSasUrlFromBlob,
  defaultBlobGenerateSasUrlOptions,
  withExpireInMinutes,
  withPermissions,
  getBlobClient,
} from "@io-sign/io-sign/infra/azure/storage/blob";

export const toDocumentWithSasUrl =
  (permissions: string = "r", expireMminutes: number = 5) =>
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
            withExpireInMinutes(expireMminutes)
          )
        )
      ),
      RTE.map((url) => ({
        ...document,
        url,
      }))
    );

export type GetDocumentUrl = (
  document: DocumentReady
) => TE.TaskEither<Error, string>;

export const getDocumentUrl =
  (permissions: string, expireMminutes: number) => (document: DocumentReady) =>
    pipe(
      document,
      toDocumentWithSasUrl(permissions, expireMminutes),
      RTE.map((el) => el.url)
    );
