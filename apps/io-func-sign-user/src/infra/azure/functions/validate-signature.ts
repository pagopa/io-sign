import { createHandler } from "@pagopa/handler-kit";
import * as azure from "@pagopa/handler-kit/lib/azure";

import * as TE from "fp-ts/lib/TaskEither";

import { flow, identity, constVoid } from "fp-ts/lib/function";

import { Database } from "@azure/cosmos";

import { ContainerClient } from "@azure/storage-blob";

import { QueueClient } from "@azure/storage-queue";
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
  onRejectedQueueClient: QueueClient
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

  const getQtspSignatureRequest = makeGetSignatureRequestWithToken()(
    makeGetToken()
  )(qtspConfig);

  const validateSignature = makeValidateSignature(
    getSignature,
    getSignedDocumentUrl,
    upsertSignature,
    getSignatureRequest,
    upsertSignatureRequest,
    getQtspSignatureRequest,
    notifySignatureRequestSignedEvent,
    notifySignatureRequestRejectedEvent
  );

  const decodeQueueMessage = flow(
    azure.fromQueueMessage(ValidateSignaturePayload),
    TE.fromEither
  );

  return createHandler(
    decodeQueueMessage,
    validateSignature,
    identity,
    constVoid
  );
};

export const makeValidateSignatureFunction = flow(
  makeValidateSignatureHandler,
  azure.unsafeRun
);
