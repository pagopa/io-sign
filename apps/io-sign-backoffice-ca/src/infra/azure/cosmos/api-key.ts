import { ApiKey, ApiKeyAlreadyExistsError, ApiKeyBody } from "@/api-key";
import { Config } from "@/app/config";
import { CosmosDatabaseError } from "@/error";
import { CosmosClient } from "@azure/cosmos";

export async function readApiKey(
  { displayName, environment, institutionId }: ApiKeyBody,
  cosmosClient: CosmosClient,
  config: Config
) {
  const { dbName, containerName } = config.azure.cosmos;
  await cosmosClient
    .database(dbName)
    .container(containerName)
    .items.query({
      parameters: [
        {
          name: "@displayName",
          value: displayName,
        },
        {
          name: "@environment",
          value: environment,
        },
        {
          name: "@institutionId",
          value: institutionId,
        },
      ],
      query:
        "SELECT * FROM c WHERE c.displayName = @displayName AND c.environment = @environment AND c.institutionId = @institutionId",
    })
    .fetchAll()
    .then((items) => {
      if (items.resources.length !== 0) {
        throw new ApiKeyAlreadyExistsError("The API key already exists");
      }
    })
    .catch((error) => {
      throw error.name !== "ApiKeyAlreadyExistsError"
        ? new CosmosDatabaseError("There has been an error")
        : error;
    });
}

export async function insertApiKey(
  apiKey: ApiKey,
  cosmosClient: CosmosClient,
  config: Config
) {
  try {
    const { dbName, containerName } = config.azure.cosmos;
    await cosmosClient
      .database(dbName)
      .container(containerName)
      .items.create(apiKey);
    return apiKey;
  } catch (error) {
    throw new CosmosDatabaseError("There has been an error");
  }
}
