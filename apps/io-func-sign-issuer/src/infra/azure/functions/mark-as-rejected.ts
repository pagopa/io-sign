import { Database } from "@azure/cosmos";

import * as azure from "@pagopa/handler-kit/lib/azure";
import { createHandler } from "@pagopa/handler-kit";

import * as TE from "fp-ts/lib/TaskEither";
import { identity, flow } from "fp-ts/lib/function";

import { SignatureRequestRejected } from "@io-sign/io-sign/signature-request";

import { makeSubmitMessageForUser } from "@io-sign/io-sign/infra/io-services/message";
import { makeGetFiscalCodeBySignerId } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { IOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { makeCreateAndSendAnalyticsEvent } from "@io-sign/io-sign/infra/azure/event-hubs/event";
import { EventHubProducerClient } from "@azure/event-hubs";
import { makeMarkRequestAsRejected } from "../../../app/use-cases/mark-request-rejected";
import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest,
} from "../cosmos/signature-request";
import { makeGetDossier } from "../cosmos/dossier";

const makeRequestAsRejectedHandler = (
  db: Database,
  tokenizer: PdvTokenizerClientWithApiKey,
  ioApiClient: IOApiClient,
  eventHubAnalyticsClient: EventHubProducerClient
) => {
  const getSignatureRequestFromQueue = flow(
    azure.fromQueueMessage(SignatureRequestRejected),
    TE.fromEither
  );
  const getDossier = makeGetDossier(db);
  const getSignatureRequest = makeGetSignatureRequest(db);
  const upsertSignatureRequest = makeUpsertSignatureRequest(db);
  const submitMessage = makeSubmitMessageForUser(ioApiClient);
  const getFiscalCodeBySignerId = makeGetFiscalCodeBySignerId(tokenizer);
  const createAndSendAnalyticsEvent = makeCreateAndSendAnalyticsEvent(
    eventHubAnalyticsClient
  );

  const markAsRejected = makeMarkRequestAsRejected(
    getDossier,
    getSignatureRequest,
    upsertSignatureRequest,
    submitMessage,
    getFiscalCodeBySignerId,
    createAndSendAnalyticsEvent
  );

  return createHandler(
    getSignatureRequestFromQueue,
    markAsRejected,
    identity,
    () => undefined
  );
};

export const makeRequestAsRejectedFunction = flow(
  makeRequestAsRejectedHandler,
  azure.unsafeRun
);
