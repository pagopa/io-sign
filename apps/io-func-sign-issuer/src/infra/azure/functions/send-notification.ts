import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import * as azure from "@pagopa/handler-kit/lib/azure";

import { flow, pipe } from "fp-ts/lib/function";
import { HttpRequest } from "@pagopa/handler-kit/lib/http";
import { error, success } from "@io-sign/io-sign/infra/http/response";
import { sequenceS } from "fp-ts/lib/Apply";
import { createHandler } from "@pagopa/handler-kit";
import { Database as CosmosDatabase } from "@azure/cosmos";
import { makeSubmitMessageForUser } from "@io-sign/io-sign/infra/io-services/message";
import { IOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";

import { makeGetFiscalCodeBySignerId } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";

import { NotificationDetailView } from "../../http/models/NotificationDetailView";
import { mockGetIssuerBySubscriptionId } from "../../__mocks__/issuer";

import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest,
} from "../cosmos/signature-request";

import { makeRequireSignatureRequest } from "../../http/decoders/signature-request";
import {
  makeSendNotification,
  SendNotificationPayload,
} from "../../../app/use-cases/send-notification";
import { NotificationToApiModel } from "../../http/encoders/notification";
import { makeGetDossier } from "../cosmos/dossier";

const makeSendNotificationHandler = (
  db: CosmosDatabase,
  ioApiClient: IOApiClient,
  tokenizer: PdvTokenizerClientWithApiKey
) => {
  const getSignatureRequest = makeGetSignatureRequest(db);
  const upsertSignatureRequest = makeUpsertSignatureRequest(db);
  const submitMessage = makeSubmitMessageForUser(ioApiClient);
  const getFiscalCodeBySignerId = makeGetFiscalCodeBySignerId(tokenizer);
  const getDossier = makeGetDossier(db);

  const sendNotification = makeSendNotification(
    submitMessage,
    getFiscalCodeBySignerId,
    getDossier,
    upsertSignatureRequest
  );

  const requireSignatureRequest = makeRequireSignatureRequest(
    mockGetIssuerBySubscriptionId,
    getSignatureRequest
  );

  const requireSendNotificationPayload: RTE.ReaderTaskEither<
    HttpRequest,
    Error,
    SendNotificationPayload
  > = sequenceS(RTE.ApplyPar)({
    signatureRequest: requireSignatureRequest,
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

export const makeSendNotificationFunction = (
  database: CosmosDatabase,
  pdvTokenizerClient: PdvTokenizerClientWithApiKey,
  ioApiClient: IOApiClient
) =>
  pipe(
    makeSendNotificationHandler(database, ioApiClient, pdvTokenizerClient),
    azure.unsafeRun
  );
