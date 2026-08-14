"use client";

import { CreateWebhookPayload, CreateWebhookResponse, createWebhookResponseSchema } from "./index";

export async function createWebhook(
  payload: CreateWebhookPayload
): Promise<CreateWebhookResponse> {
  const resp = await fetch(`/api/webhooks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }
  return createWebhookResponseSchema.parse(await resp.json());
}
