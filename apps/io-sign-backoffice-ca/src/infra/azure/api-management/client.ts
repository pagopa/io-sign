import { DefaultAzureCredential } from "@azure/identity";
import { ApiManagementClient } from "@azure/arm-apimanagement";
import { getApimConfigFromEnvironment } from "./config";

const apimConfig = getApimConfigFromEnvironment();
let apimClient: ApiManagementClient | null = null;

export const getApimClient = () => {
  if (!apimClient) {
    apimClient = new ApiManagementClient(
      new DefaultAzureCredential(),
      apimConfig.subscriptionId
    );
  }
  return apimClient;
};
