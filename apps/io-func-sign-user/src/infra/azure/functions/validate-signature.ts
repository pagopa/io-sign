import { createHandler } from "handler-kit-legacy";
import * as azure from "handler-kit-legacy/lib/azure";

import * as TE from "fp-ts/lib/TaskEither";

import { flow, identity, constVoid } from "fp-ts/lib/function";

import { makeCreateAndSendAnalyticsEvent } from "@io-sign/io-sign/infra/azure/event-hubs/event";

import { Database } from "@azure/cosmos";
import { ContainerClient } from "@azure/storage-blob";
import { QueueClient } from "@azure/storage-queue";
import { EventHubProducerClient } from "@azure/event-hubs";

import {
  makeValidateSignature,
  ValidateSignaturePayload,
} from "../../../app/use-cases/validate-signature";
import { makeGetSignature, makeUpsertSignature } from "../cosmos/signature";
import { makeGetToken } from "../../namirial/client";
import { makeGetSignatureRequestWithToken } from "../../namirial/signature-request";
import { NamirialConfig } from "../../namirial/config";
import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest,
} from "../cosmos/signature-request";
import { makeGetBlobUrl } from "../storage/blob";
import {
  makeNotifySignatureRequestRejectedEvent,
  makeNotifySignatureRequestSignedEvent,
} from "../storage/signature-request";

const makeValidateSignatureHandler = (
  db: Database,
  signedContainerClient: ContainerClient,
  qtspConfig: NamirialConfig,
  onSignedQueueClient: QueueClient,
  onRejectedQueueClient: QueueClient,
  eventHubAnalyticsClient: EventHubProducerClient,
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
    eventHubAnalyticsClient,
  );
  const getQtspSignatureRequest = makeGetSignatureRequestWithToken()(
    makeGetToken(),
  )(qtspConfig);

  const validateSignature = makeValidateSignature(
    getSignature,
    getSignedDocumentUrl,
    upsertSignature,
    getSignatureRequest,
    upsertSignatureRequest,
    getQtspSignatureRequest,
    notifySignatureRequestSignedEvent,
    notifySignatureRequestRejectedEvent,
    createAndSendAnalyticsEvent,
  );

  const decodeQueueMessage = flow(
    azure.fromQueueMessage(ValidateSignaturePayload),
    TE.fromEither,
  );

  return createHandler(
    decodeQueueMessage,
    validateSignature,
    identity,
    constVoid,
  );
};

export const makeValidateSignatureFunction = flow(
  makeValidateSignatureHandler,
  azure.unsafeRun,
);
