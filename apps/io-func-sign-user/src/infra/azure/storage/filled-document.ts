import { ContainerClient } from "@azure/storage-blob";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { toError } from "fp-ts/lib/Either";
import { UploadFilledDocument } from "../../../filled-document";

export const makeUploadFilledDocument =
  (containerClient: ContainerClient): UploadFilledDocument =>
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
            `Unable to upload blob! Error code: ${result.response.errorCode}}`
          )
      ),
      TE.map((result) => result.blockBlobClient.url)
    );
