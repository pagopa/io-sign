import { getApimClient } from "../apim";

import { ApiKey, ApiKeyWithSecret } from "./index";

export async function createApiKeySubscription(
  apiKey: ApiKey
): Promise<string> {
  return getApimClient().createSubscription(apiKey.id, apiKey.displayName);
}

export function deleteApiKeySubscription(apiKey: ApiKey): Promise<void> {
  return getApimClient().deleteSubscription(apiKey.id);
}

export async function exposeApiKeySecret(
  apiKey: ApiKey
): Promise<ApiKeyWithSecret> {
  const secret = await getApimClient().getSecret(apiKey.id);
  return { ...apiKey, secret };
}
