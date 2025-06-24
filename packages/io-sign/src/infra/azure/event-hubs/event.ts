import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";
import { EventHubProducerClient } from "@azure/event-hubs";

import {
  CreateAndSendAnalyticsEvent,
  EventName,
  GenericEvent,
  SendEvent,
  createAndSendAnalyticsEvent,
  sendEvent
} from "../../../event";
import {
  SignatureRequestCancelled,
  SignatureRequestDraft,
  SignatureRequestReady,
  SignatureRequestRejected,
  SignatureRequestSigned,
  SignatureRequestToBeSigned,
  SignatureRequestWaitForQtsp
} from "../../../signature-request";
import { ConsoleLogger } from "../../console-logger";

export const makeSendEvent =
  (eventAnalyticsClient: EventHubProducerClient): SendEvent =>
  (event: GenericEvent) =>
    pipe({ eventAnalyticsClient }, sendEvent(event));

export const makeCreateAndSendAnalyticsEvent =
  (eventAnalyticsClient: EventHubProducerClient): CreateAndSendAnalyticsEvent =>
  (eventName: EventName) =>
  (
    signatureRequest:
      | SignatureRequestDraft
      | SignatureRequestSigned
      | SignatureRequestReady
      | SignatureRequestToBeSigned
      | SignatureRequestWaitForQtsp
      | SignatureRequestRejected
      | SignatureRequestCancelled
  ): TE.TaskEither<Error, typeof signatureRequest> =>
    pipe(
      {
        eventAnalyticsClient,
        logger: ConsoleLogger
      },
      pipe(signatureRequest, createAndSendAnalyticsEvent(eventName))
    );
