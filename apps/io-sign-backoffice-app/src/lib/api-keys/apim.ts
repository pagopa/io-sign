import { getApimClient } from "../apim";

import { ApiKey } from "./index";

export async function createApiKeySubscription(
  apiKey: ApiKey
): Promise<string> {
  return getApimClient().createSubscription(apiKey.id, apiKey.displayName);
}

export function deleteApiKeySubscription(apiKey: ApiKey): Promise<void> {
  return getApimClient().deleteSubscription(apiKey.id);
}

export async function getApiKeySecret(apiKey: ApiKey): Promise<string> {
  return getApimClient().getSecret(apiKey.id);
}
