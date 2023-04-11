import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import { EventHubProducerClient } from "@azure/event-hubs";
import * as L from "@pagopa/logger";
import { ConsoleLogger } from "../../console-logger";

import {
  createAnalyticsEvent,
  EventName,
  GenericEvent,
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

export const makeSendEvent =
  (client: EventHubProducerClient): SendEvent =>
  (event: GenericEvent) =>
    pipe(
      TE.tryCatch(() => client.createBatch(), E.toError),
      TE.chain((eventDataBatch) =>
        eventDataBatch.tryAdd({ body: event })
          ? TE.right(eventDataBatch)
          : TE.left(new Error("Unable to add new events to event hub batch!"))
      ),
      TE.chain((eventDataBatch) =>
        TE.tryCatch(() => client.sendBatch(eventDataBatch), E.toError)
      ),
      TE.map(() => event)
    );

export const makeCreateAndSendAnalyticsEvent =
  (client: EventHubProducerClient) =>
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
      signatureRequest,
      createAnalyticsEvent(eventName),
      makeSendEvent(client),
      TE.map(() => signatureRequest),
      // This is a fire and forget operation
      TE.alt(() =>
        pipe(
          TE.right(signatureRequest),
          TE.chainFirstIOK(() =>
            L.error("Unable to send analytics event", {
              eventName,
              signatureRequest,
            })({
              logger: ConsoleLogger,
            })
          ),
          TE.mapLeft(
            () => new Error("Unable to send analytics event to datalake")
          )
        )
      )
    );
