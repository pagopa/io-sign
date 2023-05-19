import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";
import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as L from "@pagopa/logger";

import { pipe } from "fp-ts/lib/function";
import { Id, newId } from "./id";
import {
  SignatureRequestDraft,
  SignatureRequestId,
  SignatureRequestReady,
  SignatureRequestRejected,
  SignatureRequestSigned,
  SignatureRequestToBeSigned,
  SignatureRequestWaitForQtsp,
  SignatureRequestCancelled,
} from "./signature-request";
import { IssuerEnvironment } from "./issuer";
import { SignerId } from "./signer";

const EventId = Id;

// We currently only have a free testing plan and a paid standard plan
export const PricingPlan = t.keyof({
  FREE: null,
  DEFAULT: null,
  INTERNAL: null,
});
export type PricingPlan = t.TypeOf<typeof PricingPlan>;

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
  QTSP_API_ERROR = "io.sign.qtsp.api.error",
}

// This is the structure of an event that is used for billing and analytics
const BaseEvent = t.type({
  id: EventId,
  signatureRequestId: SignatureRequestId,
  signerId: SignerId,
  internalInstitutionId: Id,
  createdAt: IsoDateFromString,
  pricingPlan: PricingPlan,
  department: t.string,
});

type BaseEvent = t.TypeOf<typeof BaseEvent>;

type SignatureRequest =
  | SignatureRequestDraft
  | SignatureRequestSigned
  | SignatureRequestReady
  | SignatureRequestToBeSigned
  | SignatureRequestWaitForQtsp
  | SignatureRequestRejected
  | SignatureRequestCancelled;

export const BillingEvent = t.intersection([
  BaseEvent,
  t.type({ name: t.literal(EventName.SIGNATURE_SIGNED) }),
]);

export type BillingEvent = t.TypeOf<typeof BillingEvent>;

export const pricingPlanFromIssuerEnvironment = (
  issuerEnvironment: IssuerEnvironment
) => (issuerEnvironment === "TEST" ? "FREE" : issuerEnvironment);

export const createBillingEvent = (
  signatureRequest: SignatureRequestSigned
): BillingEvent => ({
  id: newId(),
  name: EventName.SIGNATURE_SIGNED,
  signatureRequestId: signatureRequest.id,
  signerId: signatureRequest.signerId,
  internalInstitutionId: signatureRequest.issuerInternalInstitutionId,
  createdAt: new Date(),
  pricingPlan: pricingPlanFromIssuerEnvironment(
    signatureRequest.issuerEnvironment
  ),
  department: signatureRequest.issuerDepartment,
});

export const AnalyticsEvent = t.intersection([
  BaseEvent,
  t.type({
    name: t.string,
    dossierId: Id,
  }),
]);

export type AnalyticsEvent = t.TypeOf<typeof AnalyticsEvent>;

export const createAnalyticsEvent =
  (eventName: EventName) =>
  (signatureRequest: SignatureRequest): AnalyticsEvent => ({
    id: newId(),
    name: eventName,
    signatureRequestId: signatureRequest.id,
    signerId: signatureRequest.signerId,
    internalInstitutionId: signatureRequest.issuerInternalInstitutionId,
    createdAt: new Date(),
    pricingPlan: pricingPlanFromIssuerEnvironment(
      signatureRequest.issuerEnvironment
    ),
    dossierId: signatureRequest.dossierId,
    department: signatureRequest.issuerDepartment,
  });

export type GenericEvent = BillingEvent | AnalyticsEvent;

export type SendEvent = (
  event: GenericEvent
) => TE.TaskEither<Error, GenericEvent>;

export type CreateAndSendAnalyticsEvent = (
  eventName: EventName
) => (
  signatureRequest: SignatureRequest
) => TE.TaskEither<Error, typeof signatureRequest>;

type EventData = {
  body: GenericEvent;
};

type EventDataBatch = {
  tryAdd(eventData: EventData): boolean;
};

type EventProducerClient = {
  createBatch(): Promise<EventDataBatch>;
  close: () => Promise<void>;
  sendBatch(batch: EventDataBatch): Promise<void>;
};

type EventAnalyticsClient = {
  eventAnalyticsClient: EventProducerClient;
};

export const sendEvent =
  (
    event: GenericEvent
  ): RTE.ReaderTaskEither<EventAnalyticsClient, Error, GenericEvent> =>
  ({ eventAnalyticsClient }) =>
    pipe(
      TE.tryCatch(() => eventAnalyticsClient.createBatch(), E.toError),
      TE.chain((eventDataBatch) =>
        eventDataBatch.tryAdd({ body: event })
          ? TE.right(eventDataBatch)
          : TE.left(new Error("Unable to add new events to event batch!"))
      ),
      TE.chain((eventDataBatch) =>
        TE.tryCatch(
          () => eventAnalyticsClient.sendBatch(eventDataBatch),
          E.toError
        )
      ),
      TE.map(() => event)
    );

export const createAndSendAnalyticsEvent =
  (eventName: EventName) => (signatureRequest: SignatureRequest) =>
    pipe(
      signatureRequest,
      createAnalyticsEvent(eventName),
      sendEvent,
      RTE.map(() => signatureRequest),
      RTE.chainFirstW(() =>
        L.debugRTE("Send analytics event", { eventName, signatureRequest })
      ),
      // This is a fire and forget operation
      RTE.altW(() =>
        pipe(
          RTE.right(signatureRequest),
          RTE.chainFirst(() =>
            L.errorRTE("Unable to send analytics event", {
              eventName,
              signatureRequest,
            })
          )
        )
      )
    );
