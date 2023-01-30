import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";
import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { Id, newId } from "./id";
import {
  SignatureRequestId,
  SignatureRequestSigned,
} from "./signature-request";
import { Issuer } from "./issuer";

const EventId = Id;

// We currently only have a free testing plan and a paid standard plan
export const PricingPlan = t.keyof({
  FREE: null,
  DEFAULT: null,
});
export type PricingPlan = t.TypeOf<typeof PricingPlan>;

// This is the structure of an event that is used for billing and analytics
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

const createBillingEvent =
  (pricingPlan: PricingPlan, internalInstitutionId: Id) =>
  (signatureRequest: SignatureRequestSigned): BillingEvent => ({
    id: newId(),
    name: "io.sign.signature_request.signed",
    signatureRequestId: signatureRequest.id,
    internalInstitutionId,
    createdAt: new Date(),
    pricingPlan,
  });

export const createBillingEventFromIssuer =
  (issuer: Issuer) =>
  (signatureRequest: SignatureRequestSigned): BillingEvent =>
    pipe(
      signatureRequest,
      /*
      The plan to use varies according to the environment used by the issuer.
      If it is in a test environment the free plan should be used otherwise standard.
      */
      createBillingEvent(
        issuer.environment === "TEST" ? "FREE" : "DEFAULT",
        issuer.id
      )
    );
