import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";

import { EventName } from "../../../sign-event";
import { SignatureRequest } from "../../../signature-request";
import { ConsoleLogger } from "../../console-logger";
import {
  CreateAndSendSignEvent,
  createAndSendSignEvent,
  SignEventsProducerClient
} from "../../../sign-event";

// export const makeSendEvent =
//   (eventAnalyticsClient: EventHubProducerClient): SendEvent =>
//   (event: GenericEvent) =>
//     pipe({ eventAnalyticsClient }, sendEvent(event));

export const makeCreateAndSendSignEvent =
  (signEventsClient: SignEventsProducerClient): CreateAndSendSignEvent =>
  (eventName: EventName) =>
  (
    signatureRequest: SignatureRequest
  ): TE.TaskEither<Error, SignatureRequest> =>
    pipe(
      {
        signEventsClient,
        logger: ConsoleLogger
      },
      pipe(signatureRequest, createAndSendSignEvent(eventName))
    );
