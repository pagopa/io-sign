import { Database } from "@azure/cosmos";

import * as azure from "handler-kit-legacy/lib/azure";
import { createHandler } from "handler-kit-legacy";

import * as TE from "fp-ts/lib/TaskEither";
import { identity, flow } from "fp-ts/lib/function";

import { SignatureRequestSigned } from "@io-sign/io-sign/signature-request";

import { EventHubProducerClient } from "@azure/event-hubs";
import { makeSubmitMessageForUser } from "@io-sign/io-sign/infra/io-services/message";
import { makeGetFiscalCodeBySignerId } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { IOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import { makeSendEvent } from "@io-sign/io-sign/infra/azure/event-hubs/event";
import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest,
} from "../cosmos/signature-request";
import { makeMarkRequestAsSigned } from "../../../app/use-cases/mark-request-signed";
import { makeGetDossier } from "../cosmos/dossier";

const makeRequestAsSignedHandler = (
  db: Database,
  tokenizer: PdvTokenizerClientWithApiKey,
  ioApiClient: IOApiClient,
  eventHubBillingClient: EventHubProducerClient
) => {
  const getSignatureRequestFromQueue = flow(
    azure.fromQueueMessage(SignatureRequestSigned),
    TE.fromEither
  );
  const getDossier = makeGetDossier(db);
  const getSignatureRequest = makeGetSignatureRequest(db);
  const upsertSignatureRequest = makeUpsertSignatureRequest(db);
  const submitMessage = makeSubmitMessageForUser(ioApiClient);
  const getFiscalCodeBySignerId = makeGetFiscalCodeBySignerId(tokenizer);

  const sendBillingEvent = makeSendEvent(eventHubBillingClient);

  const markAsSigned = makeMarkRequestAsSigned(
    getDossier,
    getSignatureRequest,
    upsertSignatureRequest,
    submitMessage,
    getFiscalCodeBySignerId,
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
