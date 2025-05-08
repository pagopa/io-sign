import { ContainerClient } from "@azure/storage-blob";
import { toError } from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

export type GetBlobUrl = (blobName: string) => O.Option<string>;
export const makeGetBlobUrl =
  (containerClient: ContainerClient): GetBlobUrl =>
  (blobName: string) =>
    pipe(
      containerClient.getBlockBlobClient(blobName),
      O.fromNullable,
      O.map((block) => block.url)
    );

export type UploadBlob = (
  blobName: string
) => (content: Uint8Array) => TE.TaskEither<Error, string>;

export const makeUploadBlob =
  (containerClient: ContainerClient): UploadBlob =>
  (blobName: string) =>
  (content: Uint8Array) =>
    pipe(
      TE.tryCatch(
        () =>
          containerClient.uploadBlockBlob(blobName, content, content.length),
        toError
      ),
      TE.filterOrElse(
        (result) => result.response.errorCode === undefined,
        (result) =>
          new Error(
            `Unable to upload blob! Error code: ${result.response.errorCode}`
          )
      ),
      TE.map((result) => result.blockBlobClient.url)
    );
