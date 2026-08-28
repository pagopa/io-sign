import { GenericError } from "@pagopa/hexagonal-core/domain/errors";
import { ulid } from "ulid";
import type { Logger, UseCase } from "@pagopa/hexagonal-core/domain/ports";
import { err, ok } from "neverthrow";
import type { SignEvent } from "../../domain/sign-event.js";
import { AnalyticsEventName } from "../../domain/pdnd-event.js";
import type {
  AnalyticsEvent,
  BillingEvent,
  PricingPlan
} from "../../domain/pdnd-event.js";
import type { SignEventPDNDPublisher } from "../../domain/ports/outbound/sign-event-pdnd-publisher.js";

const toPricingPlan = (env: "TEST" | "DEFAULT" | "INTERNAL"): PricingPlan =>
  env === "TEST" ? "FREE" : env;

const toAnalyticsEvent = (event: SignEvent): AnalyticsEvent | null => {
  const nameResult = AnalyticsEventName.safeParse(event.eventName);
  if (!nameResult.success) return null;
  const req = event.payload.signatureRequest;
  return {
    id: ulid(),
    name: nameResult.data,
    signatureRequestId: req.id,
    signerId: req.signerId,
    internalInstitutionId: req.issuerInternalInstitutionId,
    createdAt: new Date().toISOString(),
    pricingPlan: toPricingPlan(req.issuerEnvironment),
    dossierId: req.dossierId,
    department: req.issuerDepartment
  };
};

const toBillingEvent = (event: SignEvent): BillingEvent | null => {
  if (event.eventName !== "io.sign.signature_request.signed") return null;
  const req = event.payload.signatureRequest;
  return {
    id: ulid(),
    name: "io.sign.signature_request.signed",
    signatureRequestId: req.id,
    signerId: req.signerId,
    internalInstitutionId: req.issuerInternalInstitutionId,
    createdAt: new Date().toISOString(),
    pricingPlan: toPricingPlan(req.issuerEnvironment),
    department: req.issuerDepartment
  };
};

export type SignEventPDNDDeps = {
  logger: Logger;
  pdndPublisher: SignEventPDNDPublisher;
};

export const makeSignEventPDNDUseCase =
  ({
    logger,
    pdndPublisher
  }: SignEventPDNDDeps): UseCase<SignEvent, void, GenericError> =>
  async (signEvent) => {
    const analytics = toAnalyticsEvent(signEvent);
    if (analytics !== null) {
      const analyticsResult = await pdndPublisher.sendAnalyticsEvent(analytics);
      if (analyticsResult.isErr()) {
        logger.error("failed to send analytics event to pdnd", {
          eventName: signEvent.eventName
        });
        return err(analyticsResult.error);
      }
    }

    const billing = toBillingEvent(signEvent);
    if (billing !== null) {
      const billingResult = await pdndPublisher.sendBillingEvent(billing);
      if (billingResult.isErr()) {
        logger.error("failed to send billing event to pdnd", {
          eventName: signEvent.eventName
        });
        return err(billingResult.error);
      }
    }

    return ok(undefined);
  };
