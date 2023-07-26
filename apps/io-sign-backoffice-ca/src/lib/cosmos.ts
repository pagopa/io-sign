import { z } from "zod";
import { CosmosClient } from "@azure/cosmos";
import { cache } from "react";

export class CosmosDatabaseError extends Error {
  constructor(message: string, cause = {}) {
    super(message);
    this.name = "CosmosDatabaseError";
    this.cause = cause;
  }
}

const Config = z
  .object({
    COSMOS_DB_CONNECTION_STRING: z.string().nonempty(),
    COSMOS_DB_NAME: z.string().nonempty(),
    COSMOS_CONTAINER_NAME: z.string().nonempty(),
  })
  .transform((env) => ({
    cosmosDbConnectionString: env.COSMOS_DB_CONNECTION_STRING,
    cosmosDbName: env.COSMOS_DB_NAME,
    cosmosContainerName: env.COSMOS_CONTAINER_NAME,
  }));

export const getCosmosConfig = cache(() => {
  const result = Config.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing cosmos config", {
      cause: result.error.issues,
    });
  }
  return result.data;
});

export const getCosmosClient = cache(
  () => new CosmosClient(getCosmosConfig().cosmosDbConnectionString)
);
