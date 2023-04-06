import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";
import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";
import { Id, newId } from "./id";
import {
  SignatureRequestId,
  SignatureRequestSigned,
} from "./signature-request";

const EventId = Id;

// We currently only have a free testing plan and a paid standard plan
export const PricingPlan = t.keyof({
  FREE: null,
  DEFAULT: null,
  INTERNAL: null,
});
export type PricingPlan = t.TypeOf<typeof PricingPlan>;

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
  t.type({ name: t.literal("io.sign.signature_request.signed") }),
]);

export type BillingEvent = t.TypeOf<typeof BillingEvent>;

export type SendBillingEvent = (
  event: BillingEvent
) => TE.TaskEither<Error, BillingEvent>;

export const createBillingEvent = (
  signatureRequest: SignatureRequestSigned
): BillingEvent => ({
  id: newId(),
  name: "io.sign.signature_request.signed",
  signatureRequestId: signatureRequest.id,
  internalInstitutionId: signatureRequest.issuerInternalInstitutionId,
  createdAt: new Date(),
  pricingPlan:
    signatureRequest.issuerEnvironment === "TEST"
      ? "FREE"
      : signatureRequest.issuerEnvironment,
  department: signatureRequest.issuerDepartment,
});
