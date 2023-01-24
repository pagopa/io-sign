import { QueueClient } from "@azure/storage-queue";

import { enqueue } from "@io-sign/io-sign/infra/azure/storage/queue";
import { pipe } from "fp-ts/lib/function";
import {
  NotifySignatureRequestWaitForSignatureEvent,
  NotifySignatureRequestSignedEvent,
  NotifySignatureRequestRejectedEvent,
} from "../../../signature-request";

export const makeNotifySignatureRequestWaitForSignatureEvent =
  (queueClient: QueueClient): NotifySignatureRequestWaitForSignatureEvent =>
  (request) =>
    pipe(queueClient, enqueue(request));

export const makeNotifySignatureRequestSignedEvent =
  (queueClient: QueueClient): NotifySignatureRequestSignedEvent =>
  (request) =>
    pipe(queueClient, enqueue(request));

export const makeNotifySignatureRequestRejectedEvent =
  (queueClient: QueueClient): NotifySignatureRequestRejectedEvent =>
  (request) =>
    pipe(queueClient, enqueue(request));
