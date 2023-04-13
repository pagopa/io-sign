import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";
import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";
import { Id, newId } from "./id";
import {
  SignatureRequestDraft,
  SignatureRequestId,
  SignatureRequestReady,
  SignatureRequestRejected,
  SignatureRequestSigned,
  SignatureRequestToBeSigned,
  SignatureRequestWaitForQtsp,
} from "./signature-request";
import { IssuerEnvironment } from "./issuer";

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
  internalInstitutionId: Id,
  createdAt: IsoDateFromString,
  pricingPlan: PricingPlan,
  department: t.string,
});

type BaseEvent = t.TypeOf<typeof BaseEvent>;

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
  (
    signatureRequest:
      | SignatureRequestDraft
      | SignatureRequestSigned
      | SignatureRequestReady
      | SignatureRequestToBeSigned
      | SignatureRequestWaitForQtsp
      | SignatureRequestRejected
  ): AnalyticsEvent => ({
    id: newId(),
    name: eventName,
    signatureRequestId: signatureRequest.id,
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
