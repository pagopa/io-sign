import { CosmosClient } from "@azure/cosmos";
import { ApiManagementClient } from "@azure/arm-apimanagement";
import { Config } from "@/app/config";
import { insertApiKey, readApiKey } from "@/infra/azure/cosmos/api-key";
import { newApiKey, parseApiKeyBody } from "@/api-key";
import { createApimSubscription } from "@/infra/azure/api-management/subscription";

export async function addApiKey(
  request: Request,
  cosmosClient: CosmosClient,
  apimClient: ApiManagementClient,
  config: Config
) {
  return (
    request
      .json()
      .then(parseApiKeyBody)
      // check if the api key for the given input already exists
      .then(async (apiKey) => {
        await readApiKey(apiKey, cosmosClient, config);
        return apiKey;
      })
      .then(async (apiKey) => {
        const primaryKey = await createApimSubscription(
          apiKey.resourceId,
          apiKey.displayName,
          apimClient,
          config
        );
        return { ...apiKey, primaryKey };
      })
      .then(newApiKey)
      // for the moment, primary key will be saved on database
      .then((apiKey) => insertApiKey(apiKey, cosmosClient, config))
      .then(({ id, primaryKey }) => ({ id, primaryKey }))
  );
}
