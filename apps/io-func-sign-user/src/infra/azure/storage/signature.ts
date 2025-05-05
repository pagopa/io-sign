import { QueueClient } from "@azure/storage-queue";
import { enqueue } from "@io-sign/io-sign/infra/azure/storage/queue";
import { pipe } from "fp-ts/lib/function";

import { NotifySignatureReadyEvent } from "../../../signature";

export const makeNotifySignatureReadyEvent =
  (queueClient: QueueClient): NotifySignatureReadyEvent =>
  (request) =>
    pipe(queueClient, enqueue(request));
