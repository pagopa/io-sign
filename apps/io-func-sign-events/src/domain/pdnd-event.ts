import { z } from "zod";

// non-standard UUID regex (same as sign-event.ts — real data uses non-RFC4122 versions)
const uuid = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i
  );

export const PricingPlan = z.enum(["FREE", "DEFAULT", "INTERNAL"]);
export type PricingPlan = z.infer<typeof PricingPlan>;

const baseEvent = z.object({
  id: uuid,
  signatureRequestId: z.ulid(),
  signerId: uuid,
  internalInstitutionId: uuid,
  createdAt: z.string().datetime(),
  pricingPlan: PricingPlan,
  department: z.string()
});

// subset of SignEvent EventName: excludes wait_for_signature and wait_for_qtsp
export const AnalyticsEventName = z.enum([
  "io.sign.signature_request.created",
  "io.sign.signature_request.signed",
  "io.sign.signature_request.ready",
  "io.sign.signature_request.rejected",
  "io.sign.signature_request.cancelled",
  "io.sign.signature_request.document.uploaded",
  "io.sign.signature_request.document.rejected",
  "io.sign.signature_request.notification.sent",
  "io.sign.signature_request.notification.rejected",
  "io.sign.qtsp.certificate.created",
  "io.sign.qtsp.certificate.rejected",
  "io.sign.qtsp.api.error"
]);
export type AnalyticsEventName = z.infer<typeof AnalyticsEventName>;

export const AnalyticsEvent = baseEvent.extend({
  name: AnalyticsEventName,
  dossierId: z.ulid()
});
export type AnalyticsEvent = z.infer<typeof AnalyticsEvent>;

export const BillingEvent = baseEvent.extend({
  name: z.literal("io.sign.signature_request.signed")
});
export type BillingEvent = z.infer<typeof BillingEvent>;
