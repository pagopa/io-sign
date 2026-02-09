import { createHandler } from "handler-kit-legacy";
import * as azure from "handler-kit-legacy/lib/azure";

import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";

import { constVoid, flow, identity, pipe } from "fp-ts/lib/function";

import { makeCreateAndSendAnalyticsEvent } from "@io-sign/io-sign/infra/azure/event-hubs/event";

import { Database } from "@azure/cosmos";
import { ContainerClient } from "@azure/storage-blob";
import { QueueClient } from "@azure/storage-queue";
import { EventHubProducerClient } from "@azure/event-hubs";

import {
  ValidateSignaturePayload,
  makeValidateSignature
} from "../../../app/use-cases/validate-signature";
import { makeGetSignature, makeUpsertSignature } from "../cosmos/signature";
import { makeGetToken } from "../../namirial/client";
import { makeGetSignatureRequestWithToken } from "../../namirial/signature-request";
import { NamirialConfig } from "../../namirial/config";
import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest
} from "../cosmos/signature-request";
import { makeGetBlobUrl } from "../storage/blob";
import {
  makeNotifySignatureRequestRejectedEvent,
  makeNotifySignatureRequestSignedEvent
} from "../storage/signature-request";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 30000;

const delay =
  (ms: number): T.Task<void> =>
  () =>
    new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = <A>(
  task: TE.TaskEither<Error, A>,
  retryCount: number = 0
): TE.TaskEither<Error, A> =>
  pipe(
    task,
    TE.orElse((error) => {
      if (retryCount < MAX_RETRIES) {
        return pipe(
          delay(RETRY_DELAY_MS),
          T.chain(() => withRetry(task, retryCount + 1))
        );
      }
      return TE.left(error);
    })
  );

const makeValidateSignatureHandler = (
  db: Database,
  signedContainerClient: ContainerClient,
  qtspConfig: NamirialConfig,
  onSignedQueueClient: QueueClient,
  onRejectedQueueClient: QueueClient,
  eventHubAnalyticsClient: EventHubProducerClient
) => {
  const getSignature = makeGetSignature(db);
  const upsertSignature = makeUpsertSignature(db);
  const getSignatureRequest = makeGetSignatureRequest(db);
  const upsertSignatureRequest = makeUpsertSignatureRequest(db);
  const getSignedDocumentUrl = makeGetBlobUrl(signedContainerClient);
  const notifySignatureRequestSignedEvent =
    makeNotifySignatureRequestSignedEvent(onSignedQueueClient);
  const notifySignatureRequestRejectedEvent =
    makeNotifySignatureRequestRejectedEvent(onRejectedQueueClient);
  const createAndSendAnalyticsEvent = makeCreateAndSendAnalyticsEvent(
    eventHubAnalyticsClient
  );
  const getQtspSignatureRequest =
    makeGetSignatureRequestWithToken()(makeGetToken())(qtspConfig);

  const validateSignature = makeValidateSignature(
    getSignature,
    getSignedDocumentUrl,
    upsertSignature,
    getSignatureRequest,
    upsertSignatureRequest,
    getQtspSignatureRequest,
    notifySignatureRequestSignedEvent,
    notifySignatureRequestRejectedEvent,
    createAndSendAnalyticsEvent
  );

  const decodeQueueMessage = flow(
    azure.fromQueueMessage(ValidateSignaturePayload),
    TE.fromEither
  );

  // Wrap validateSignature with retry logic
  const validateSignatureWithRetry = (payload: ValidateSignaturePayload) =>
    withRetry(validateSignature(payload));

  return createHandler(
    decodeQueueMessage,
    validateSignatureWithRetry,
    identity,
    constVoid
  );
};

export const makeValidateSignatureFunction = flow(
  makeValidateSignatureHandler,
  azure.unsafeRun
);
