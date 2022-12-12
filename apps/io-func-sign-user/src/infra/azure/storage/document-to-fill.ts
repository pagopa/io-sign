import { QueueClient } from "@azure/storage-queue";

import { enqueue } from "@io-sign/io-sign/infra/azure/storage/queue";
import { pipe } from "fp-ts/lib/function";
import { NotifyDocumentToFillEvent } from "../../../filled-document";

export const makeNotifyDocumentToFill =
  (queueClient: QueueClient): NotifyDocumentToFillEvent =>
  (documentToFill) =>
    pipe(queueClient, enqueue(documentToFill));
