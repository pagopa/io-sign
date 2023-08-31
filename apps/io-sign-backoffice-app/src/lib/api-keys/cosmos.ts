import "server-only";

import { getCosmosConfig, getCosmosContainerClient } from "@/lib/cosmos";
import { FeedResponse } from "@azure/cosmos";

import { apiKeySchema, ApiKey } from "./index";

export async function* getApiKeys(institutionId: string, displayName?: string) {
  const { cosmosContainerName } = getCosmosConfig();
  let query = "SELECT * FROM c WHERE c.institutionId = @institutionId";
  const parameters = [
    {
      name: "@institutionId",
      value: institutionId,
    },
  ];

  if (displayName) {
    parameters.push({ name: "@displayName", value: displayName });
    query = query.concat(" AND c.displayName = @displayName");
  }

  const cosmosResponse: AsyncIterable<FeedResponse<ApiKey>> =
    getCosmosContainerClient(cosmosContainerName)
      .items.query({
        parameters,
        query,
      })
      .getAsyncIterator();

  for await (const { resources } of cosmosResponse) {
    for (const resource of resources) {
      yield apiKeySchema.parse(resource);
    }
  }
}

export async function apiKeyExists(
  institutionId: string,
  displayName: string
): Promise<boolean> {
  const apiKeys = getApiKeys(institutionId, displayName);
  const item = await apiKeys.next();
  return !item.done;
}

export async function insertApiKey(apiKey: ApiKey): Promise<void> {
  const { cosmosContainerName } = getCosmosConfig();
  await getCosmosContainerClient(cosmosContainerName).items.create(apiKey);
}

export async function getApiKey(
  id: string,
  institutionId: string
): Promise<ApiKey> {
  try {
    const { cosmosContainerName } = getCosmosConfig();
    const { resource } = await getCosmosContainerClient(cosmosContainerName)
      .item(id, institutionId)
      .read();
    return apiKeySchema.parse(resource);
  } catch (e) {
    throw new Error("unable to get the API key", { cause: e });
  }
}

export async function upsertApiKeyField<
  F extends keyof Pick<ApiKey, "cidrs" | "testers">
>(id: string, institutionId: string, field: F, newValue: ApiKey[F]) {
  try {
    const cosmos = getCosmosContainerClient("api-keys");
    await cosmos.item(id, institutionId).patch({
      operations: [
        {
          path: `/${field}`,
          op: "replace",
          value: newValue,
        },
      ],
    });
  } catch (e) {
    throw new Error(`unable to update the ${field} field`, { cause: e });
  }
}
