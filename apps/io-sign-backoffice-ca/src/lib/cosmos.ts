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
    DB_CONNECTION_STRING: z.string().nonempty(),
    DB_NAME: z.string().nonempty(),
    CONTAINER_NAME: z.string().nonempty(),
  })
  .transform((env) => ({
    dbConnectionString: env.DB_CONNECTION_STRING,
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
    cosmosClient = new CosmosClient(cosmosConfig.dbConnectionString);
  }
  return cosmosClient;
};
