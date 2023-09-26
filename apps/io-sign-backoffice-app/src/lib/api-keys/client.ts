"use client";

import { createContext } from "react";

import { z } from "zod";

import { ApiKey, CreateApiKeyPayload } from "./index";

export const ApiKeyContext = createContext<ApiKey | undefined>(undefined);

export const apiErrorSchema = z.object({
  details: z.string().optional(),
});

const createApiKeyResponseSchema = z.object({
  id: z.string().ulid(),
});

export async function createApiKey(payload: CreateApiKeyPayload) {
  const resp = await fetch(`/api/api-keys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }
  const json = await resp.json();
  return createApiKeyResponseSchema.parse(json);
}

export async function upsertApiKeyField(
  apiKey: ApiKey,
  field: "cidrs" | "testers" | "status",
  value: unknown
) {
  const operations = [{ op: "replace", path: `/${field}`, value }];
  const resp = await fetch(
    `/api/institutions/${apiKey.institutionId}/api-keys/${apiKey.id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(operations),
    }
  );
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }
}
