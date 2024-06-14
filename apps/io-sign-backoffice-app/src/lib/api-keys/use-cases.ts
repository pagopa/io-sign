import {
  apiKeyExists,
  insertApiKey,
  getApiKeys,
  getApiKey,
  patchApiKey,
} from "./cosmos";

import {
  createApiKeySubscription,
  deleteApiKeySubscription,
  getApiKeySecret,
  suspendApiKeySubscription,
} from "./apim";

import { ApiKey, ApiKeyWithSecret, CreateApiKeyPayload } from "./index";
import { ulid } from "ulid";
import { sendMessage } from "@/lib/slack";
import { getInstitution } from "@/lib/institutions/use-cases";
import { getIssuerByInstitution } from "@/lib/issuers/use-cases";
import { getPiiFromToken, getTokenFromPii } from "../pdv-tokenizer";

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
    const institution = await getInstitution(payload.institutionId);
    if (!institution) {
      throw new Error("institution does not exists");
    }
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
      const tokens = await Promise.all(apiKey.testers.map(getTokenFromPii));
      await insertApiKey({ ...apiKey, testers: tokens });
    } catch (e) {
      await deleteApiKeySubscription(apiKey);
      throw new Error("unable to create the API key", { cause: e });
    }
    const issuer = await getIssuerByInstitution(institution);
    await sendMessage(
      `(_backoffice_) *${institution.name}* (\`${issuer?.externalId}\`) ha creato una nuova API Key di *${payload.environment}*.\nHa configurato *${payload.cidrs.length}* indirizzi IP di test e *${payload.testers.length}* codici fiscali.`
    );
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
      const testers = await Promise.all(apiKey.testers.map(getPiiFromToken));
      apiKeys.push({ ...apiKey, testers });
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
    const apiKeyWithSecret = await exposeApiKeySecret(apiKey);
    const testers = await Promise.all(apiKey.testers.map(getPiiFromToken));
    return { ...apiKeyWithSecret, testers };
  } catch (e) {
    throw new Error("unable to get the API Key", { cause: e });
  }
}

export async function revokeApiKey(id: string, institutionId: string) {
  try {
    await suspendApiKeySubscription({ id });
    await patchApiKey(id, institutionId, "status", "revoked");
  } catch (e) {
    throw new Error("Unable to revoke the API Key", { cause: e });
  }
}

export async function upsertApiKeyField(
  id: string,
  institutionId: string,
  field: keyof Pick<ApiKey, "cidrs" | "status" | "testers">,
  value: ApiKey[typeof field]
) {
  const newValue =
    field === "testers" && Array.isArray(value)
      ? await Promise.all(value.map(getTokenFromPii))
      : value;
  await patchApiKey(id, institutionId, field, newValue);
}

export { getApiKeyById } from "./cosmos";
