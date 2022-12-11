import { QueueClient } from "@azure/storage-queue";

import { enqueue } from "@io-sign/io-sign/infra/azure/storage/queue";
import { pipe } from "fp-ts/lib/function";
import { NotifySignatureRequestWaitForSignatureEvent } from "../../../signature-request";

export const makeNotifySignatureRequestReadyEvent =
  (queueClient: QueueClient): NotifySignatureRequestWaitForSignatureEvent =>
  (request) =>
    pipe(queueClient, enqueue(request));
