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
  DOCUMENT_UPLOADED = "io.sign.signature_request.document.uploaded",
  DOCUMENT_REJECTED = "io.sign.signature_request.document.rejected",
  SIGNATURE_READY = "io.sign.signature_request.ready",
  NOTIFICATION_SENT = "io.sign.signature_request.notification.sent",
  SIGNATURE_CANCELLED = "io.sign.signature_request.cancelled",
  SIGNATURE_WAIT_FOR_SIGNATURE = "io.sign.signature_request.wait_for_signature",
  SIGNATURE_WAIT_FOR_QTSP = "io.sign.signature_request.wait_for_qtsp",
  CERTIFICATE_CREATED = "io.sign.qtsp.certificate.created",
  CERTIFICATE_REJECTED = "io.sign.qtsp.certificate.rejected",
  QTSP_API_ERROR = "io.sign.qtsp.api.error",
  SIGNATURE_REJECTED = "io.sign.signature_request.rejected",
  SIGNATURE_SIGNED = "io.sign.signature_request.signed",
  NOTIFICATION_REJECTED = "io.sign.signature_request.notification.rejected"
}

export const eventNameByRequestStatus: Record<
  SignatureRequest["status"],
  EventName
> = {
  DRAFT: EventName.SIGNATURE_CREATED,
  READY: EventName.SIGNATURE_READY,
  CANCELLED: EventName.SIGNATURE_CANCELLED,
  WAIT_FOR_SIGNATURE: EventName.SIGNATURE_WAIT_FOR_SIGNATURE,
  WAIT_FOR_QTSP: EventName.SIGNATURE_WAIT_FOR_QTSP,
  REJECTED: EventName.SIGNATURE_REJECTED,
  SIGNED: EventName.SIGNATURE_SIGNED
};

const SignatureRequestEventPayload = t.type({
  payloadType: t.literal("signature_request"),
  payload: SignatureRequest
});

const SignatureRequestDocumentEventPayload = t.type({
  payloadType: t.literal("signature_request_document"),
  payload: t.type({
    signatureRequest: SignatureRequest,
    documentId: Id
  })
});

export const EventPayload = t.union([
  SignatureRequestEventPayload,
  SignatureRequestDocumentEventPayload
]);

export type EventPayload = t.TypeOf<typeof EventPayload>;

export const BaseSignEvent = t.intersection([
  t.type({
    eventId: EventId,
    eventName: t.string
  }),
  EventPayload
]);

export type BaseSignEvent = t.TypeOf<typeof BaseSignEvent>;

export const createSignEvent =
  (eventName: EventName) =>
  (eventPayload: EventPayload): BaseSignEvent =>
    ({
      eventId: newId(),
      eventName,
      ...eventPayload
    }) as BaseSignEvent;

export type SignEventsProducerClient = {
  createBatch(): Promise<SignEventsDataBatch>;
  close: () => Promise<void>;
  sendBatch(batch: SignEventsDataBatch): Promise<void>;
};

type SignEventsClient = {
  signEventsClient: SignEventsProducerClient;
};

type SignEventsData = {
  body: BaseSignEvent;
};

type SignEventsDataBatch = {
  tryAdd(eventData: SignEventsData): boolean;
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
      createSignEvent(eventName)({
        payloadType: "signature_request",
        payload: signatureRequest
      }),
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

export const createAndSendDocumentSignEvent =
  (eventName: EventName) =>
  (
    signatureRequest: SignatureRequest,
    documentId: Id
  ): RTE.ReaderTaskEither<
    SignEventsClient & { logger: L.Logger },
    Error,
    SignatureRequest
  > =>
    pipe(
      createSignEvent(eventName)({
        payloadType: "signature_request_document",
        payload: { signatureRequest, documentId }
      }),
      sendSignEvent,
      RTE.map(() => signatureRequest),
      RTE.chainFirstW(() =>
        L.debugRTE("Send document sign event", {
          eventName,
          signatureRequest,
          documentId
        })
      ),
      // This is a fire and forget operation
      RTE.altW(() =>
        pipe(
          RTE.right(signatureRequest),
          RTE.chainFirst(() =>
            L.errorRTE("Unable to send document sign event", {
              eventName,
              signatureRequest,
              documentId
            })
          )
        )
      )
    );

export type CreateAndSendSignEvent = (
  eventName: EventName
) => (
  signatureRequest: SignatureRequest
) => TE.TaskEither<Error, typeof signatureRequest>;
