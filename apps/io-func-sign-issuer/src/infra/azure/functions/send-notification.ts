import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import * as azure from "@pagopa/handler-kit/lib/azure";

import { flow, pipe } from "fp-ts/lib/function";
import { HttpRequest } from "@pagopa/handler-kit/lib/http";
import { error, success } from "@internal/io-sign/infra/http/response";
import { sequenceS } from "fp-ts/lib/Apply";
import { createHandler } from "@pagopa/handler-kit";
import { Database as CosmosDatabase } from "@azure/cosmos";
import { makeSubmitMessageForUser } from "@internal/io-services/message";
import { IOApiClient } from "@internal/io-services/client";
import { PdvTokenizerClientWithApiKey } from "@internal/pdv-tokenizer/client";

import { makeGetFiscalCodeBySignerId } from "@internal/pdv-tokenizer/signer";

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
import { ioApiClient } from "../../api/io-services";
import { database } from "../cosmos/client";
import { pdvTokenizerClientWithApiKey } from "../../api/tokenizer";

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
    upsertSignatureRequest,
    getDossier
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

export const run = pipe(
  makeSendNotificationHandler(
    database,
    ioApiClient,
    pdvTokenizerClientWithApiKey
  ),
  azure.unsafeRun
);
