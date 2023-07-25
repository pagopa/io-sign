import { CosmosClient } from "@azure/cosmos";
import { getCosmosConfig } from "./config";

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
