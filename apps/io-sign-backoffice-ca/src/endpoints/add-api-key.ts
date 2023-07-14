import { insertApiKey, readApiKey } from "@/infra/azure/cosmos/api-key";
import { newApiKey, parseApiKeyBody } from "@/api-key";
import { createApimSubscription } from "@/infra/azure/api-management/subscription";

export async function addApiKey(request: Request) {
  return (
    request
      .json()
      .then(parseApiKeyBody)
      // check if the api key for the given input already exists
      .then(async (apiKey) => {
        await readApiKey(apiKey);
        return apiKey;
      })
      .then(async (apiKey) => {
        const primaryKey = await createApimSubscription(
          apiKey.resourceId,
          apiKey.displayName
        );
        return { ...apiKey, primaryKey };
      })
      .then(({ primaryKey, ...apiKey }) => ({
        apiKey: newApiKey(apiKey),
        primaryKey,
      }))
      .then(async ({ apiKey, primaryKey }) => {
        await insertApiKey(apiKey);
        return { id: apiKey.id, primaryKey };
      })
  );
}
