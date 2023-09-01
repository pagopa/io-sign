import { apiKeyExists, insertApiKey, getApiKeys, getApiKey } from "./cosmos";

import {
  createApiKeySubscription,
  deleteApiKeySubscription,
  getApiKeySecret,
} from "./apim";

import { ApiKey, ApiKeyWithSecret, CreateApiKeyPayload } from "./index";
import { ulid } from "ulid";
import { getToken } from "../tokenizer";

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
    // check if the api key with the given displayName already exists for that institution
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
      const tokens = await Promise.all(apiKey.testers.map(getToken));
      await insertApiKey({ ...apiKey, testers: tokens });
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

async function exposeApiKeySecret(apiKey: ApiKey): Promise<ApiKeyWithSecret> {
  const secret = await getApiKeySecret(apiKey);
  return { ...apiKey, secret };
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
    throw new Error("unable to get the API Key", { cause: e });
  }
}

export { upsertApiKeyField } from "./cosmos";
