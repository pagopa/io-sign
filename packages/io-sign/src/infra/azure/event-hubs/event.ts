import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";
import { EventHubProducerClient } from "@azure/event-hubs";

import {
  createAndSendAnalyticsEvent,
  CreateAndSendAnalyticsEvent,
  EventName,
  GenericEvent,
  sendEvent,
  SendEvent,
} from "../../../event";
import {
  SignatureRequestDraft,
  SignatureRequestSigned,
  SignatureRequestReady,
  SignatureRequestToBeSigned,
  SignatureRequestWaitForQtsp,
  SignatureRequestRejected,
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
  ): TE.TaskEither<Error, typeof signatureRequest> =>
    pipe(
      {
        eventAnalyticsClient,
        logger: ConsoleLogger,
      },
      pipe(signatureRequest, createAndSendAnalyticsEvent(eventName))
    );
