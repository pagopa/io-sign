import { z } from "zod";

export const EventName = z.enum([
  "signature-request.status.update",
  "signature-request.document.status.update"
]);

export type EventName = z.infer<typeof EventName>;

export const webhookEvent = z.discriminatedUnion("eventType", [
  z.object({
    eventId: z.ulid(),
    eventType: z.literal("signature-request.status.update"),
    timestamp: z.date(),
    generatedAt: z.date(),
    signatureRequestId: z.ulid(),
    status: z.enum([
      // "WAIT_FOR_SIGNATURE",
      // "WAIT_FOR_QTSP",
      "SIGNED",
      "REJECTED"
    ])
  }),
  z.object({
    eventId: z.ulid(),
    eventType: z.literal("signature-request.document.status.update"),
    timestamp: z.date(),
    generatedAt: z.date(),
    signatureRequestId: z.ulid(),
    documentStatus: z.enum(["READY", "REJECTED"]),
    documentId: z.ulid()
  })
]);
export type WebhookEvent = z.infer<typeof webhookEvent>;
