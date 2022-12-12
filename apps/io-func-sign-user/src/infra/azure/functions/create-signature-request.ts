import { Database } from "@azure/cosmos";

import * as azure from "@pagopa/handler-kit/lib/azure";
import { createHandler } from "@pagopa/handler-kit";

import * as TE from "fp-ts/lib/TaskEither";
import { identity, flow } from "fp-ts/lib/function";

import { SignatureRequestReady } from "@io-sign/io-sign/signature-request";

import { QueueClient } from "@azure/storage-queue";
import { makeInsertSignatureRequest } from "../cosmos/signature-request";
import { makeCreateSignatureRequest } from "../../../app/use-cases/create-signature-request";
import { makeNotifySignatureRequestReadyEvent } from "../storage/signature-request";

const makeCreateSignatureRequestHandler = (
  db: Database,
  onWaitForSignatureQueueClient: QueueClient
) => {
  const getSignatureRequestFromQueue = flow(
    azure.fromQueueMessage(SignatureRequestReady),
    TE.fromEither
  );
  const createSignatureRequest = makeCreateSignatureRequest(
    makeInsertSignatureRequest(db),
    makeNotifySignatureRequestReadyEvent(onWaitForSignatureQueueClient)
  );
  return createHandler(
    getSignatureRequestFromQueue,
    createSignatureRequest,
    identity,
    () => undefined
  );
};

export const makeCreateSignatureRequestFunction = flow(
  makeCreateSignatureRequestHandler,
  azure.unsafeRun
);
