import { z } from "zod";

export const CosmosConfig = z.object({
  accountEndpoint: z.string(),
  accountKey: z.string(),
  dbName: z.string(),
  containerName: z.string(),
});

export type CosmosConfig = z.infer<typeof CosmosConfig>;

export const getCosmosConfigFromEnvironment = (): CosmosConfig =>
  z
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
    }))
    .parse(process.env);
