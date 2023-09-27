import {
  apiKeyExists,
  insertApiKey,
  getApiKeys,
  getApiKey,
  upsertApiKeyField,
} from "./cosmos";

import {
  createApiKeySubscription,
  deleteApiKeySubscription,
  getApiKeySecret,
  suspendApiKeySubscription,
} from "./apim";

import { ApiKey, ApiKeyWithSecret, CreateApiKeyPayload } from "./index";
import { ulid } from "ulid";

function ApiKey(payload: CreateApiKeyPayload): ApiKey {
  const apiKey = {
    ...payload,
    id: ulid(),
    createdAt: new Date(),
    status: "active" as const,
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
    }
    return apiKey.id;
  } catch (e) {
    throw e instanceof ApiKeyAlreadyExistsError
      ? e
      : new Error("unable to create the API key", { cause: e });
  }
}

async function exposeApiKeySecret(apiKey: ApiKey): Promise<ApiKeyWithSecret> {
  const secret = await getApiKeySecret(apiKey);
  return { ...apiKey, secret };
}

export async function listApiKeys(institutionId: string) {
  try {
    const apiKeys: ApiKey[] = [];
    for await (const apiKey of getApiKeys(institutionId)) {
      apiKeys.push(apiKey);
    }
    return apiKeys;
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
    throw new Error("unable to get the API Key", { cause: e });
  }
}

export async function revokeApiKey(id: string, institutionId: string) {
  try {
    await suspendApiKeySubscription({ id });
    await upsertApiKeyField(id, institutionId, "status", "revoked");
  } catch (e) {
    throw new Error("Unable to revoke the API Key", { cause: e });
  }
}

export { upsertApiKeyField, getApiKeyById } from "./cosmos";
