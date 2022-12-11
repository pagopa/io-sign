import { QueueClient } from "@azure/storage-queue";

import { enqueue } from "@io-sign/io-sign/infra/azure/storage/queue";
import { pipe } from "fp-ts/lib/function";
import { NotifySignatureReadyEvent } from "../../../filled-document";

export const makeNotifyDocumentToFill =
  (queueClient: QueueClient): NotifySignatureReadyEvent =>
  (documentToFill) =>
    pipe(queueClient, enqueue(documentToFill));
