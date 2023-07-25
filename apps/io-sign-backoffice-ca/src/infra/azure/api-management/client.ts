import { DefaultAzureCredential } from "@azure/identity";
import { ApiManagementClient } from "@azure/arm-apimanagement";
import { getApimConfig } from "./config";

const apimConfig = getApimConfig();
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
