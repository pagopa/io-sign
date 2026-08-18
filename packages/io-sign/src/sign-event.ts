import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as L from "@pagopa/logger";

import { pipe } from "fp-ts/lib/function";
import { Id, newId } from "./id";
import { SignatureRequest } from "./signature-request";

const EventId = Id;

/*
 * This mapping was decided together with the datalake team and is documented here:
 * https://pagopa.atlassian.net/wiki/spaces/SFEQS/pages/552108033/Fatturazione
 */
export enum EventName {
  SIGNATURE_CREATED = "io.sign.signature_request.created",
  SIGNATURE_SIGNED = "io.sign.signature_request.signed",
  SIGNATURE_READY = "io.sign.signature_request.ready",
  SIGNATURE_REJECTED = "io.sign.signature_request.rejected",
  SIGNATURE_CANCELLED = "io.sign.signature_request.cancelled",
  DOCUMENT_UPLOADED = "io.sign.signature_request.document.uploaded",
  DOCUMENT_REJECTED = "io.sign.signature_request.document.rejected",
  NOTIFICATION_SENT = "io.sign.signature_request.notification.sent",
  NOTIFICATION_REJECTED = "io.sign.signature_request.notification.rejected",
  CERTIFICATE_CREATED = "io.sign.qtsp.certificate.created",
  CERTIFICATE_REJECTED = "io.sign.qtsp.certificate.rejected",
  QTSP_API_ERROR = "io.sign.qtsp.api.error"
}

const BaseSignEvent = t.type({
  eventId: EventId,
  eventName: t.string,
  signatureRequest: SignatureRequest
});

type BaseSignEvent = t.TypeOf<typeof BaseSignEvent>;

export const createSignEvent =
  (eventName: EventName) =>
  (signatureRequest: SignatureRequest): BaseSignEvent => ({
    eventId: newId(),
    eventName,
    signatureRequest
  });

type SignEventsClient = {
  signEventsClient: SignEventsProducerClient;
};

type SignEventsData = {
  body: BaseSignEvent;
};

type SignEventsDataBatch = {
  tryAdd(eventData: SignEventsData): boolean;
};

type SignEventsProducerClient = {
  createBatch(): Promise<SignEventsDataBatch>;
  close: () => Promise<void>;
  sendBatch(batch: SignEventsDataBatch): Promise<void>;
};

export const sendSignEvent =
  (
    event: BaseSignEvent
  ): RTE.ReaderTaskEither<SignEventsClient, Error, BaseSignEvent> =>
  ({ signEventsClient }) =>
    pipe(
      TE.tryCatch(() => signEventsClient.createBatch(), E.toError),
      TE.chain((eventDataBatch) =>
        eventDataBatch.tryAdd({ body: event })
          ? TE.right(eventDataBatch)
          : TE.left(new Error("Unable to add new events to event batch!"))
      ),
      TE.chain((eventDataBatch) =>
        TE.tryCatch(() => signEventsClient.sendBatch(eventDataBatch), E.toError)
      ),
      TE.map(() => event)
    );

export const createAndSendSignEvent =
  (eventName: EventName) =>
  (
    signatureRequest: SignatureRequest
  ): RTE.ReaderTaskEither<
    SignEventsClient & { logger: L.Logger },
    Error,
    SignatureRequest
  > =>
    pipe(
      signatureRequest,
      createSignEvent(eventName),
      sendSignEvent,
      RTE.map(() => signatureRequest),
      RTE.chainFirstW(() =>
        L.debugRTE("Send sign event", { eventName, signatureRequest })
      ),
      // This is a fire and forget operation
      RTE.altW(() =>
        pipe(
          RTE.right(signatureRequest),
          RTE.chainFirst(() =>
            L.errorRTE("Unable to send sign event", {
              eventName,
              signatureRequest
            })
          )
        )
      )
    );
