import * as H from "@pagopa/handler-kit";

import { Database } from "@azure/cosmos";
import { ContainerClient } from "@azure/storage-blob";
import { QueueClient } from "@azure/storage-queue";
import { EventHubProducerClient } from "@azure/event-hubs";

import { makeCreateAndSendAnalyticsEvent } from "@io-sign/io-sign/infra/azure/event-hubs/event";
import { makeCreateAndSendSignEvent } from "@io-sign/io-sign/infra/azure/event-hubs/sign-event";
import { SignEventsProducerClient } from "@io-sign/io-sign/sign-event";

import {
  makeValidateSignature,
  ValidateSignaturePayload
} from "../../app/use-cases/validate-signature";
import {
  makeGetSignature,
  makeUpsertSignature
} from "../azure/cosmos/signature";
import { makeGetToken } from "../namirial/client";
import { makeGetSignatureRequestWithToken } from "../namirial/signature-request";
import { NamirialConfig } from "../namirial/config";
import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest
} from "../azure/cosmos/signature-request";
import { makeGetBlobUrl } from "../azure/storage/blob";
import {
  makeNotifySignatureRequestRejectedEvent,
  makeNotifySignatureRequestSignedEvent
} from "../azure/storage/signature-request";

export type ValidateSignatureEnvironment = {
  db: Database;
  signedContainerClient: ContainerClient;
  qtspConfig: NamirialConfig;
  onSignedQueueClient: QueueClient;
  onRejectedQueueClient: QueueClient;
  eventHubAnalyticsClient: EventHubProducerClient;
  signEventsClient: SignEventsProducerClient;
};

export const ValidateSignatureHandler = H.of(
  (payload: ValidateSignaturePayload) =>
    ({
      db,
      signedContainerClient,
      qtspConfig,
      onSignedQueueClient,
      onRejectedQueueClient,
      eventHubAnalyticsClient,
      signEventsClient
    }: ValidateSignatureEnvironment) => {
      const validateSignature = makeValidateSignature(
        makeGetSignature(db),
        makeGetBlobUrl(signedContainerClient),
        makeUpsertSignature(db),
        makeGetSignatureRequest(db),
        makeUpsertSignatureRequest(db),
        makeGetSignatureRequestWithToken()(makeGetToken())(qtspConfig),
        makeNotifySignatureRequestSignedEvent(onSignedQueueClient),
        makeNotifySignatureRequestRejectedEvent(onRejectedQueueClient),
        makeCreateAndSendAnalyticsEvent(eventHubAnalyticsClient),
        makeCreateAndSendSignEvent(signEventsClient)
      );
      return validateSignature(payload);
    }
);
