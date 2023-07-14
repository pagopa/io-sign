import { CosmosClient } from "@azure/cosmos";
import { getCosmosConfigFromEnvironment } from "./config";

const cosmosConfig = getCosmosConfigFromEnvironment();
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
