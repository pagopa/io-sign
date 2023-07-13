import { z } from "zod";
import {
  CosmosConfig,
  getCosmosConfigFromEnvironment,
} from "@/infra/azure/cosmos/config";
import {
  ApimConfig,
  getApimConfigFromEnvironment,
} from "@/infra/azure/api-management/config";
import { CosmosClient } from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";
import { ApiManagementClient } from "@azure/arm-apimanagement";

export const Config = z.object({
  azure: z.object({
    cosmos: CosmosConfig,
    apim: ApimConfig,
  }),
});

export type Config = z.infer<typeof Config>;

export const getConfigFromEnvironment = () =>
  Config.parse({
    azure: {
      cosmos: getCosmosConfigFromEnvironment(),
      apim: getApimConfigFromEnvironment(),
    },
  });

export const config = getConfigFromEnvironment();

export const cosmosClient = new CosmosClient({
  endpoint: config.azure.cosmos.accountEndpoint,
  key: config.azure.cosmos.accountKey,
});

export const apimClient = new ApiManagementClient(
  new DefaultAzureCredential(),
  config.azure.apim.subscriptionId
);
