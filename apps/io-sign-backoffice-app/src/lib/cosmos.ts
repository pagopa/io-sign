import { z } from "zod";
import { CosmosClient } from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";
import { cache } from "react";

let cosmosClient: CosmosClient;

const Config = z
  .discriminatedUnion("USE_MANAGED_IDENTITY", [
    z.object({
      USE_MANAGED_IDENTITY: z.literal("true"),
      COSMOS_DB__accountEndpoint: z.string().min(1),
      COSMOS_DB_NAME: z.string().min(1),
    }),
    z.object({
      USE_MANAGED_IDENTITY: z.literal("false"),
      COSMOS_DB_CONNECTION_STRING: z.string().min(1),
      COSMOS_DB_NAME: z.string().min(1),
    }),
  ])
  .transform((env) => ({
    cosmosDbName: env.COSMOS_DB_NAME,
    auth:
      env.USE_MANAGED_IDENTITY === "true"
        ? ({ mode: "rbac", endpoint: env.COSMOS_DB__accountEndpoint } as const)
        : ({
            mode: "connection-string",
            connectionString: env.COSMOS_DB_CONNECTION_STRING,
          } as const),
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
    const { auth } = getCosmosConfig();
    cosmosClient =
      auth.mode === "rbac"
        ? new CosmosClient({
            endpoint: auth.endpoint,
            aadCredentials: new DefaultAzureCredential(),
          })
        : new CosmosClient(auth.connectionString);
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
