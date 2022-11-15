import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import * as azure from "@pagopa/handler-kit/lib/azure";

import { flow, identity, pipe } from "fp-ts/lib/function";
import { HttpRequest } from "@pagopa/handler-kit/lib/http";
import { error, success } from "@internal/io-sign/infra/http/response";
import { sequenceS } from "fp-ts/lib/Apply";
import { createHandler } from "@pagopa/handler-kit";
import { CosmosClient, Database as CosmosDatabase } from "@azure/cosmos";
import { makeSubmitMessageForUser } from "@internal/io-services/message";
import { createIOApiClient, IOApiClient } from "@internal/io-services/client";
import {
  PdvTokenizerClient,
  createPdvTokenizerClient,
} from "@internal/pdv-tokenizer/client";

import { makeGetFiscalCodeBySignerId } from "@internal/pdv-tokenizer/signer";

import { NotificationDetailView } from "../../http/models/NotificationDetailView";
import { mockGetIssuerBySubscriptionId } from "../../__mocks__/issuer";

import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest,
} from "../cosmos/signature-request";

import { makeRequireSignatureRequest } from "../../http/decoders/signature-request";
import { getConfigFromEnvironment } from "../../../app/config";
import {
  makeSendNotification,
  SendNotificationPayload,
} from "../../../app/use-cases/send-notification";
import { NotificationToApiModel } from "../../http/encoders/notification";
import { makeGetDossier } from "../cosmos/dossier";

const makeSendNotificationHandler = (
  db: CosmosDatabase,
  ioApiClient: IOApiClient,
  tokenizer: PdvTokenizerClient
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

const configOrError = pipe(
  getConfigFromEnvironment(process.env),
  E.getOrElseW(identity)
);

if (configOrError instanceof Error) {
  throw configOrError;
}

const config = configOrError;

const cosmosClient = new CosmosClient(config.azure.cosmos.connectionString);
const database = cosmosClient.database(config.azure.cosmos.dbName);
const ioApiClient = createIOApiClient(
  config.pagopa.ioServices.basePath,
  config.pagopa.ioServices.subscriptionKey
);

const pdvTokenizerClient = createPdvTokenizerClient(
  config.pagopa.tokenizer.basePath,
  config.pagopa.tokenizer.apiKey
);

export const run = pipe(
  makeSendNotificationHandler(database, ioApiClient, pdvTokenizerClient),
  azure.unsafeRun
);
