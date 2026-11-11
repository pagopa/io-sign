import { z } from "zod";
import { CosmosClient } from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";
import { cache } from "react";
import * as L from "@pagopa/logger";
import { ConsoleLogger } from "@io-sign/io-sign/infra/console-logger";

let cosmosClient: CosmosClient;

const Config = z
  .discriminatedUnion("COSMOS_DB_AUTH", [
    z.object({
      COSMOS_DB_AUTH: z.literal("rbac"),
      COSMOS_DB__accountEndpoint: z.string().min(1),
      COSMOS_DB_NAME: z.string().min(1),
    }),
    z.object({
      COSMOS_DB_AUTH: z.literal("connection-string"),
      COSMOS_DB_CONNECTION_STRING: z.string().min(1),
      COSMOS_DB_NAME: z.string().min(1),
    }),
  ])
  .transform((env) => ({
    cosmosDbName: env.COSMOS_DB_NAME,
    auth:
      env.COSMOS_DB_AUTH === "rbac"
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
    if (auth.mode === "rbac") {
      L.info("Returning an RBAC CosmosClient")({ logger: ConsoleLogger })();
      cosmosClient = new CosmosClient({
        endpoint: auth.endpoint,
        aadCredentials: new DefaultAzureCredential(),
      });
    } else {
      L.info("Returning a connection-string CosmosClient")({
        logger: ConsoleLogger,
      })();
      cosmosClient = new CosmosClient(auth.connectionString);
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
