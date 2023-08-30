import { z } from "zod";
import { ulid } from "ulid";

import { apiKeyExists, insertApiKey, getApiKeys, getApiKey } from "./cosmos";

import {
  createApiKeySubscription,
  deleteApiKeySubscription,
  exposeApiKeySecret,
} from "./apim";

export const cidrSchema = z.custom<string>((val) => {
  if (typeof val !== "string") {
    return false;
  }
  const [ip, subnet] = val.split("/");
  const result = z
    .object({
      ip: z.string().ip({ version: "v4" }),
      subnet: z.enum(["8", "16", "24", "32"]),
    })
    .safeParse({ ip, subnet });
  return result.success;
}, "Invalid CIDR value");

export const fiscalCodeSchema = z
  .string()
  .regex(
    new RegExp(
      "^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$"
    )
  );

export type CIDR = z.infer<typeof cidrSchema>;

export const apiKeySchema = z.object({
  id: z.string().ulid(),
  institutionId: z.string().uuid(),
  displayName: z.string().min(3).max(40),
  environment: z.union([z.literal("test"), z.literal("prod")]),
  cidrs: z.array(cidrSchema).default([]),
  testers: z.array(fiscalCodeSchema).default([]),
  status: z.union([z.literal("active"), z.literal("revoked")]),
  createdAt: z.string().pipe(z.coerce.date()),
});

export type ApiKey = z.infer<typeof apiKeySchema>;

export const apiKeyWithSecretSchema = apiKeySchema.extend({
  secret: z.string().nonempty(),
});

export type ApiKeyWithSecret = z.infer<typeof apiKeyWithSecretSchema>;

export const createApiKeyPayloadSchema = apiKeySchema.pick({
  institutionId: true,
  displayName: true,
  environment: true,
  cidrs: true,
  testers: true,
});

export type CreateApiKeyPayload = z.infer<typeof createApiKeyPayloadSchema>;

function ApiKey(payload: CreateApiKeyPayload): ApiKey {
  const apiKey = {
    ...payload,
    id: ulid(),
    status: "active" as const,
    createdAt: new Date(),
  };
  return apiKey;
}

export class ApiKeyAlreadyExistsError extends Error {
  constructor(cause = {}) {
    super("the API key already exists");
    this.name = "ApiKeyAlreadyExistsError";
    this.cause = cause;
  }
}

export async function createApiKey(payload: CreateApiKeyPayload) {
  try {
    // check if the api key for the given input already exists
    const apiKeyAlreadyExists = await apiKeyExists(
      payload.institutionId,
      payload.displayName
    );
    if (apiKeyAlreadyExists) {
      throw new ApiKeyAlreadyExistsError(
        "such name already exists for the institution"
      );
    }
    const apiKey = ApiKey(payload);
    await createApiKeySubscription(apiKey);
    try {
      await insertApiKey(apiKey);
    } catch (e) {
      await deleteApiKeySubscription(apiKey);
      throw new Error("unable to create the API key", { cause: e });
    }
    return apiKey.id;
  } catch (e) {
    throw e instanceof ApiKeyAlreadyExistsError
      ? e
      : new Error("unable to create the API key", { cause: e });
  }
}

export async function* listApiKeys(institutionId: string) {
  try {
    const apiKeys = getApiKeys(institutionId);
    for await (const apiKey of apiKeys) {
      yield exposeApiKeySecret(apiKey);
    }
  } catch (e) {
    throw new Error("unable to get the API keys", { cause: e });
  }
}

export async function getApiKeyWithSecret(
  id: string,
  institutionId: string
): Promise<ApiKeyWithSecret> {
  try {
    const apiKey = await getApiKey(id, institutionId);
    return exposeApiKeySecret(apiKey);
  } catch (e) {
    console.log(e);
    throw new Error("unable to get the API Key", { cause: e });
  }
}

export { upsertApiKeyField } from "./cosmos";
