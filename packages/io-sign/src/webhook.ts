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

const httpsUrl = z
  .string()
  .url()
  .refine((url) => url.startsWith("https://"), {
    message: "URL must use HTTPS protocol"
  });

export const createWebhookPayloadSchema = z.object({
  institutionId: z.string().uuid(),
  url: httpsUrl
});

export type CreateWebhookPayload = z.infer<typeof createWebhookPayloadSchema>;

export const patchWebhookPayloadSchema = z.object({
  institutionId: z.string().uuid(),
  url: httpsUrl.optional(),
  status: z.enum(["active", "inactive"]).optional()
});

export type PatchWebhookPayload = z.infer<typeof patchWebhookPayloadSchema>;

export const createWebhookResponseSchema = z.object({
  id: z.string().uuid(),
  publicKey: z.string().min(1),
  publicKeyThumbprint: z.string().min(1)
});

export type CreateWebhookResponse = z.infer<typeof createWebhookResponseSchema>;

export const rotateWebhookKeyPayloadSchema = z.object({
  institutionId: z.string().uuid()
});

export type RotateWebhookKeyPayload = z.infer<
  typeof rotateWebhookKeyPayloadSchema
>;

export const rotateWebhookKeyResponseSchema = z.object({
  publicKey: z.string().min(1),
  publicKeyThumbprint: z.string().min(1)
});

export type RotateWebhookKeyResponse = z.infer<
  typeof rotateWebhookKeyResponseSchema
>;
