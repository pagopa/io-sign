import { ApiKey, ApiKeyAlreadyExistsError, ApiKeyBody } from "@/api-key";
import { CosmosDatabaseError } from "@/error";
import { getCosmosClient } from "./client";
import { getCosmosConfig } from "./config";

export async function readApiKey({
  displayName,
  environment,
  institutionId,
}: ApiKeyBody) {
  const { dbName, containerName } = getCosmosConfig();
  const cosmosClient = getCosmosClient();
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
        ? new CosmosDatabaseError("Unable to create the API key") // TODO: error handling
        : error;
    });
}

export async function insertApiKey(apiKey: ApiKey) {
  const { dbName, containerName } = getCosmosConfig();
  const cosmosClient = getCosmosClient();
  await cosmosClient
    .database(dbName)
    .container(containerName)
    .items.create(apiKey)
    .catch(() => {
      throw new CosmosDatabaseError("Unable to create the API key");
    });
}
