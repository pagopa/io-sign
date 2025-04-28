import { QueueClient } from "@azure/storage-queue";
import { enqueue } from "@io-sign/io-sign/infra/azure/storage/queue";
import { pipe } from "fp-ts/lib/function";

import { NotifySignatureRequestReadyEvent } from "../../../signature-request";

export const makeNotifySignatureRequestReadyEvent =
  (queueClient: QueueClient): NotifySignatureRequestReadyEvent =>
  (request) =>
    pipe(queueClient, enqueue(request));
