import { z } from "zod";
import { CosmosClient } from "@azure/cosmos";

export class CosmosDatabaseError extends Error {
  constructor(message: string, cause = {}) {
    super(message);
    this.name = "CosmosDatabaseError";
    this.cause = cause;
  }
}

const Config = z
  .object({
    ACCOUNT_ENDPOINT: z.string().nonempty(),
    ACCOUNT_KEY: z.string().nonempty(),
    DB_NAME: z.string().nonempty(),
    CONTAINER_NAME: z.string().nonempty(),
  })
  .transform((env) => ({
    accountEndpoint: env.ACCOUNT_ENDPOINT,
    accountKey: env.ACCOUNT_KEY,
    dbName: env.DB_NAME,
    containerName: env.CONTAINER_NAME,
  }));

export const getCosmosConfig = () => {
  const result = Config.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing cosmos config", {
      cause: result.error.issues,
    });
  }
  return result.data;
};

const cosmosConfig = getCosmosConfig();
let cosmosClient: CosmosClient | null = null;

export const getCosmosClient = () => {
  if (!cosmosClient) {
    cosmosClient = new CosmosClient({
      endpoint: cosmosConfig.accountEndpoint,
      key: cosmosConfig.accountKey,
    });
  }
  return cosmosClient;
};
