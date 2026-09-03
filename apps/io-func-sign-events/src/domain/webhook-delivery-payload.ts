import { z } from "zod";

export const webhookDeliveryPayload = z.discriminatedUnion("eventType", [
  z.object({
    eventId: z.ulid(),
    eventType: z.literal("signature-request.status.update"),
    timestamp: z.date(),
    generatedAt: z.date(),
    payload: z.object({
      signatureRequestId: z.ulid(),
      status: z.enum([
        // "WAIT_FOR_SIGNATURE",
        // "WAIT_FOR_QTSP",
        "SIGNED",
        "REJECTED"
      ])
    })
  }),
  z.object({
    eventId: z.ulid(),
    eventType: z.literal("signature-request.document.status.update"),
    timestamp: z.date(),
    generatedAt: z.date(),
    payload: z.object({
      signatureRequestId: z.ulid(),
      documentStatus: z.enum(["READY", "REJECTED"]),
      documentId: z.ulid()
    })
  })
]);

export type WebhookDeliveryPayload = z.infer<typeof webhookDeliveryPayload>;
