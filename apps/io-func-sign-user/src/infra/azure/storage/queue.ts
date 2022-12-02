import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { toError } from "fp-ts/lib/Either";
import { QueueClient } from "@azure/storage-queue";

export type EnqueueMessage = (message: string) => TE.TaskEither<Error, string>;
export const makeEnqueueMessage =
  (queueClient: QueueClient): EnqueueMessage =>
  (message: string) =>
    pipe(
      TE.tryCatch(
        () => queueClient.sendMessage(Buffer.from(message).toString("base64")),
        toError
      ),
      TE.filterOrElse(
        (response) => response.errorCode === undefined,
        (response) =>
          new Error(
            `Unable to enqueue filled document! Error code: ${response.errorCode}`
          )
      ),
      TE.map((result) => result.messageId)
    );

export const queueExists = (queueClient: QueueClient) =>
  TE.tryCatch(() => queueClient.exists(), toError);
