import { z } from "zod";
import { CosmosClient } from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";
import { cache } from "react";

let cosmosClient: CosmosClient;

const Config = z
  .object({
    COSMOS_DB_ENDPOINT: z.string().min(1),
    COSMOS_DB_CONNECTION_STRING: z.string().min(1),
    COSMOS_DB_NAME: z.string().min(1),
  })
  .transform((env) => ({
    cosmosDbEndpoint: env.COSMOS_DB_ENDPOINT,
    cosmosDbConnectionString: env.COSMOS_DB_CONNECTION_STRING,
    cosmosDbName: env.COSMOS_DB_NAME,
  }));

const getCosmosConfig = cache(() => {
  const result = Config.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing cosmos config", {
      cause: result.error.issues,
    });
  }
  return result.data;
});

const getCosmosClient = () => {
  if (!cosmosClient) {
    const config = getCosmosConfig();
    if (process.env.NODE_ENV !== "production") {
      cosmosClient = new CosmosClient(config.cosmosDbConnectionString);
    } else {
      if (!config.cosmosDbEndpoint) {
        throw new Error("COSMOS_DB_ENDPOINT must be set in production");
      }
      cosmosClient = new CosmosClient({
        endpoint: config.cosmosDbEndpoint,
        aadCredentials: new DefaultAzureCredential()
      });
    }
  }
  return cosmosClient;
};

export const getCosmosContainerClient = (cosmosContainerName: string) => {
  const { cosmosDbName } = getCosmosConfig();
  return getCosmosClient()
    .database(cosmosDbName)
    .container(cosmosContainerName);
};

export async function getCosmosHealth() {
  try {
    const cosmos = getCosmosClient();
    const { resource } = await cosmos.getDatabaseAccount();
    if (!resource) {
      throw new Error();
    }
  } catch {
    throw "cosmos-db";
  }
}
