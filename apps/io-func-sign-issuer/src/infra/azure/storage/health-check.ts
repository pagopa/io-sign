import { ContainerClient } from "@azure/storage-blob";
import { QueueClient } from "@azure/storage-queue";
import {
  HealthCheck,
  toHealthProblems
} from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

export type AzureStorageProblemSource =
  | "AzureStorageContainer"
  | "AzureStorageQueue";

export const makeAzureStorageContainerHealthCheck = (
  container: ContainerClient
): HealthCheck<AzureStorageProblemSource> =>
  pipe(
    TE.tryCatch(
      () => container.getProperties(),
      toHealthProblems("AzureStorageContainer")
    ),
    TE.map(() => true)
  );

export const makeAzureStorageQueueHealthCheck = (
  queue: QueueClient
): HealthCheck<AzureStorageProblemSource> =>
  pipe(
    TE.tryCatch(
      () => queue.getProperties(),
      toHealthProblems("AzureStorageQueue")
    ),
    TE.map(() => true)
  );
