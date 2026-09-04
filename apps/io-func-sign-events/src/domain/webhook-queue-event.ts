import { z } from "zod";
import { webhookEvent } from "./webhook-event";

export const webhookQueueEvent = z.object({
  id: z.ulid(),
  webhookUrl: z.url(),
  webhookPrivateKeySecretName: z.string().min(1),
  webhookPublicKeyThumbprint: z.string().min(1),
  retryCount: z.number(),
  webhookEvent
});
export type WebhookQueueEvent = z.infer<typeof webhookQueueEvent>;
