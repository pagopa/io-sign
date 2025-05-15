import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import * as azure from "handler-kit-legacy/lib/azure";

import { flow } from "fp-ts/lib/function";
import { HttpRequest } from "handler-kit-legacy/lib/http";
import { error, success } from "@io-sign/io-sign/infra/http/response";
import { sequenceS } from "fp-ts/lib/Apply";
import { createHandler } from "handler-kit-legacy";
import { Database as CosmosDatabase } from "@azure/cosmos";
import { makeSubmitMessageForUser } from "@io-sign/io-sign/infra/io-services/message";
import { IOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";

import { makeGetFiscalCodeBySignerId } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";

import { makeCreateAndSendAnalyticsEvent } from "@io-sign/io-sign/infra/azure/event-hubs/event";
import { EventHubProducerClient } from "@azure/event-hubs";
import { Ulid } from "@pagopa/ts-commons/lib/strings";
import { NotificationDetailView } from "../../http/models/NotificationDetailView";

import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest
} from "../cosmos/signature-request";

import { makeRequireSignatureRequest } from "../../http/decoders/signature-request";
import { makeSendNotification } from "../../../app/use-cases/send-notification";
import { NotificationToApiModel } from "../../http/encoders/notification";

import { makeGetIssuerBySubscriptionId } from "../../back-office/issuer";
import { makeRequireIssuer } from "../../http/decoders/issuer";
import { makeGetDossier } from "../cosmos/dossier";
import { SendNotificationPayload } from "../../../signature-request-notification";

const makeSendNotificationHandler = (
  db: CosmosDatabase,
  tokenizer: PdvTokenizerClientWithApiKey,
  ioApiClient: IOApiClient,
  configurationId: Ulid,
  eventHubAnalyticsClient: EventHubProducerClient
) => {
  const getSignatureRequest = makeGetSignatureRequest(db);
  const upsertSignatureRequest = makeUpsertSignatureRequest(db);
  const getIssuerBySubscriptionId = makeGetIssuerBySubscriptionId(db);
  const submitMessage = makeSubmitMessageForUser(ioApiClient, configurationId);
  const getFiscalCodeBySignerId = makeGetFiscalCodeBySignerId(tokenizer);
  const getDossier = makeGetDossier(db);
  const createAndSendAnalyticsEvent = makeCreateAndSendAnalyticsEvent(
    eventHubAnalyticsClient
  );

  const sendNotification = makeSendNotification(
    submitMessage,
    getFiscalCodeBySignerId,
    upsertSignatureRequest,
    getDossier,
    createAndSendAnalyticsEvent
  );

  const requireSignatureRequest = makeRequireSignatureRequest(
    getIssuerBySubscriptionId,
    getSignatureRequest
  );

  const requireSendNotificationPayload: RTE.ReaderTaskEither<
    HttpRequest,
    Error,
    SendNotificationPayload
  > = sequenceS(RTE.ApplyPar)({
    signatureRequest: requireSignatureRequest,
    issuer: makeRequireIssuer(getIssuerBySubscriptionId)
  });

  const decodeHttpRequest = flow(
    azure.fromHttpRequest,
    TE.fromEither,
    TE.chain(requireSendNotificationPayload)
  );

  return createHandler(
    decodeHttpRequest,
    sendNotification,
    error,
    flow(NotificationToApiModel.encode, success(NotificationDetailView))
  );
};

export const makeSendNotificationFunction = flow(
  makeSendNotificationHandler,
  azure.unsafeRun
);
