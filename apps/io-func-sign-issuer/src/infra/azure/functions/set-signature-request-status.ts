import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as RE from "fp-ts/lib/ReaderEither";

import * as azure from "handler-kit-legacy/lib/azure";
import { flow, pipe } from "fp-ts/lib/function";
import { HttpRequest } from "handler-kit-legacy/lib/http";
import { sequenceS } from "fp-ts/lib/Apply";

import { createHandler } from "handler-kit-legacy";

import { Database as CosmosDatabase } from "@azure/cosmos";
import { QueueClient } from "@azure/storage-queue";

import { validate } from "@io-sign/io-sign/validation";
import { error } from "@io-sign/io-sign/infra/http/response";
import { makeCreateAndSendAnalyticsEvent } from "@io-sign/io-sign/infra/azure/event-hubs/event";
import { EventHubProducerClient } from "@azure/event-hubs";
import { makeRequireSignatureRequest } from "../../http/decoders/signature-request";
import { SetSignatureRequestStatusBody } from "../../http/models/SetSignatureRequestStatusBody";
import { makeMarkRequestAsReady } from "../../../app/use-cases/mark-request-ready";

import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest,
} from "../cosmos/signature-request";

import { makeGetIssuerBySubscriptionId } from "../cosmos/issuer";
import { makeNotifySignatureRequestReadyEvent } from "../storage/signature-request";

const makeSetSignatureRequestStatusHandler = (
  db: CosmosDatabase,
  onSignatureRequestReadyQueueClient: QueueClient,
  eventHubAnalyticsClient: EventHubProducerClient
) => {
  const upsertSignatureRequest = makeUpsertSignatureRequest(db);
  const getSignatureRequest = makeGetSignatureRequest(db);
  const getIssuerBySubscriptionId = makeGetIssuerBySubscriptionId(db);

  const notifySignatureRequestReadyEvent = makeNotifySignatureRequestReadyEvent(
    onSignatureRequestReadyQueueClient
  );
  const createAndSendAnalyticsEvent = makeCreateAndSendAnalyticsEvent(
    eventHubAnalyticsClient
  );

  const markRequestAsReady = makeMarkRequestAsReady(
    upsertSignatureRequest,
    notifySignatureRequestReadyEvent,
    createAndSendAnalyticsEvent
  );
  const requireSignatureRequest = makeRequireSignatureRequest(
    getIssuerBySubscriptionId,
    getSignatureRequest
  );

  const requireSetSignatureRequestStatusBody: RE.ReaderEither<
    HttpRequest,
    Error,
    "READY"
  > = flow(
    (req) => req.body,
    validate(SetSignatureRequestStatusBody),
    E.filterOrElse(
      (status) => status === "READY",
      () => new Error("only READY is allowed")
    )
  );

  const requireMarkRequestAsReadyPayload = pipe(
    sequenceS(RTE.ApplyPar)({
      signatureRequest: requireSignatureRequest,
      body: RTE.fromReaderEither(requireSetSignatureRequestStatusBody),
    }),
    RTE.map(({ signatureRequest }) => signatureRequest)
  );

  const decodeHttpRequest = flow(
    azure.fromHttpRequest,
    TE.fromEither,
    TE.chain(requireMarkRequestAsReadyPayload)
  );

  return createHandler(
    decodeHttpRequest,
    markRequestAsReady,
    error,
    () => undefined
  );
};

export const makeSetSignatureRequestStatusFunction = flow(
  makeSetSignatureRequestStatusHandler,
  azure.unsafeRun
);
