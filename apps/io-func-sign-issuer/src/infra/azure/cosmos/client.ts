import { CosmosClient } from "@azure/cosmos";
import { getConfigOrThrow } from "../../../app/config";

const config = getConfigOrThrow();

const cosmosClient = new CosmosClient(config.azure.cosmos.connectionString);
export const database = cosmosClient.database(config.azure.cosmos.dbName);
