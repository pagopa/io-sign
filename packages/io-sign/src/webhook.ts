import { z } from "zod";

export const webhookSchema = z.object({
  id: z.string().uuid(),
  issuerId: z.string().min(1),
  url: z.string().url(),
  privateKeySecretName: z.string().min(1),
  publicKeyThumbprint: z.string().min(1),
  status: z.enum(["active", "inactive"])
});

export type Webhook = z.infer<typeof webhookSchema>;

export const createWebhookPayloadSchema = z.object({
  institutionId: z.string().uuid(),
  url: z.string().url()
});

export type CreateWebhookPayload = z.infer<typeof createWebhookPayloadSchema>;

export const createWebhookResponseSchema = z.object({
  id: z.string().uuid(),
  publicKey: z.string().min(1),
  publicKeyThumbprint: z.string().min(1)
});

export type CreateWebhookResponse = z.infer<typeof createWebhookResponseSchema>;
