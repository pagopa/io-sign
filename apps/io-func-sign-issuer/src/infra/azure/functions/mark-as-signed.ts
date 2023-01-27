import { Database } from "@azure/cosmos";

import * as azure from "@pagopa/handler-kit/lib/azure";
import { createHandler } from "@pagopa/handler-kit";

import * as TE from "fp-ts/lib/TaskEither";
import { identity, flow } from "fp-ts/lib/function";

import { SignatureRequestSigned } from "@io-sign/io-sign/signature-request";

import { EventHubProducerClient } from "@azure/event-hubs";
import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest,
} from "../cosmos/signature-request";
import { makeMarkRequestAsSigned } from "../../../app/use-cases/mark-request-signed";
import { makeSendBillingEvent } from "../event-hubs/event";

const makeRequestAsSignedHandler = (
  db: Database,
  eventHubBillingClient: EventHubProducerClient
) => {
  const getSignatureRequestFromQueue = flow(
    azure.fromQueueMessage(SignatureRequestSigned),
    TE.fromEither
  );
  const getSignatureRequest = makeGetSignatureRequest(db);
  const upsertSignatureRequest = makeUpsertSignatureRequest(db);

  const sendBillingEvent = makeSendBillingEvent(eventHubBillingClient);

  const markAsSigned = makeMarkRequestAsSigned(
    getSignatureRequest,
    upsertSignatureRequest,
    sendBillingEvent
  );

  return createHandler(
    getSignatureRequestFromQueue,
    markAsSigned,
    identity,
    () => undefined
  );
};

export const makeRequestAsSignedFunction = flow(
  makeRequestAsSignedHandler,
  azure.unsafeRun
);
