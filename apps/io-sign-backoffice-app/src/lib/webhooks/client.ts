"use client";

import {
  CreateWebhookPayload,
  CreateWebhookResponse,
  PatchWebhookPayload,
  RotateWebhookKeyPayload,
  RotateWebhookKeyResponse,
  createWebhookResponseSchema,
  rotateWebhookKeyResponseSchema,
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

export async function rotateWebhookKey(
  payload: RotateWebhookKeyPayload
): Promise<RotateWebhookKeyResponse> {
  const resp = await fetch(`/api/webhooks/rotate-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }
  return rotateWebhookKeyResponseSchema.parse(await resp.json());
}

export async function checkWebhookAccess(institutionId: string): Promise<boolean> {
  const url = `/api/webhooks/access?institutionId=${encodeURIComponent(institutionId)}`;
  const resp = await fetch(url);
  if (!resp.ok) return false;
  const data = await resp.json();
  return data.allowed === true;
}
