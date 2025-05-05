import { Database } from "@azure/cosmos";
import { QueueClient } from "@azure/storage-queue";
import {
  GenerateSignatureRequestQrCode,
  SignatureRequestReady
} from "@io-sign/io-sign/signature-request";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, identity } from "fp-ts/lib/function";
import { createHandler } from "handler-kit-legacy";
import * as azure from "handler-kit-legacy/lib/azure";

import { makeCreateSignatureRequest } from "../../../app/use-cases/create-signature-request";
import { makeInsertSignatureRequest } from "../cosmos/signature-request";
import { makeNotifySignatureRequestWaitForSignatureEvent } from "../storage/signature-request";

const makeCreateSignatureRequestHandler = (
  db: Database,
  onWaitForSignatureQueueClient: QueueClient,
  generateSignatureRequestQrCode: GenerateSignatureRequestQrCode
) => {
  const getSignatureRequestFromQueue = flow(
    azure.fromQueueMessage(SignatureRequestReady),
    TE.fromEither
  );
  const createSignatureRequest = makeCreateSignatureRequest(
    makeInsertSignatureRequest(db),
    makeNotifySignatureRequestWaitForSignatureEvent(
      onWaitForSignatureQueueClient
    ),
    generateSignatureRequestQrCode
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
