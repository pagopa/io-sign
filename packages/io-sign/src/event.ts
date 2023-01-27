import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";
import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";
import { Id, newId } from "./id";
import {
  SignatureRequestId,
  SignatureRequestSigned,
} from "./signature-request";

const EventId = Id;

export const PricingPlan = t.union([t.literal("FREE"), t.literal("DEFAULT")]);
export type PricingPlan = t.TypeOf<typeof PricingPlan>;

const BaseEvent = t.type({
  id: EventId,
  signatureRequestId: SignatureRequestId,
  internalInstitutionId: Id,
  createdAt: IsoDateFromString,
  pricingPlan: PricingPlan,
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

export const createBillingEvent =
  (pricingPlan: PricingPlan, internalInstitutionId: Id) =>
  (signatureRequest: SignatureRequestSigned): BillingEvent => ({
    id: newId(),
    name: "io.sign.signature_request.signed",
    signatureRequestId: signatureRequest.id,
    internalInstitutionId,
    createdAt: new Date(),
    pricingPlan,
  });