"use client";

import {
  CreateWebhookPayload,
  CreateWebhookResponse,
  PatchWebhookPayload,
  createWebhookResponseSchema,
} from "./index";

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

export async function patchWebhook(
  payload: PatchWebhookPayload
): Promise<void> {
  const resp = await fetch(`/api/webhooks`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }
}
