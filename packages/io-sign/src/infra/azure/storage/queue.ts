import { QueueClient } from "@azure/storage-queue";

import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as E from "fp-ts/lib/Either";

import { stringify } from "fp-ts/lib/Json";

import { flow, pipe } from "fp-ts/lib/function";

class StorageQueueError extends Error {
  name = "StorageQueueError";
  errorCode?: string;
  constructor(errorCode?: string) {
    super("Unable to enqueue the message.");
    this.errorCode = errorCode;
  }
}

const toBase64 = flow(Buffer.from, (b) => b.toString("base64"));

const sendMessage = (message: string) => (queueClient: QueueClient) =>
  pipe(
    TE.tryCatch(() => queueClient.sendMessage(message), E.toError),
    TE.filterOrElse(
      (response) => response.errorCode === undefined,
      (response) => new StorageQueueError(response.errorCode)
    ),
    TE.map(({ messageId }) => messageId)
  );

export const enqueue = flow(
  stringify,
  E.mapLeft(() => new Error("Unable to serialize the message.")),
  E.map(toBase64),
  RTE.fromEither,
  RTE.chainW(sendMessage)
);
