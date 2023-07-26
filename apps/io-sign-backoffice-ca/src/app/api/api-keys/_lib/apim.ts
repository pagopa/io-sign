import { z } from "zod";
import { DefaultAzureCredential } from "@azure/identity";
import { ApiManagementClient } from "@azure/arm-apimanagement";

export class SubscriptionCreationError extends Error {
  constructor(cause = {}) {
    super("unable to create the API key");
    this.name = "SubscriptionCreationError";
    this.cause = cause;
  }
}

const Config = z
  .object({
    AZURE_SUBSCRIPTION_ID: z.string().nonempty(),
    APIM_RESOURCE_GROUP_NAME: z.string().nonempty(),
    APIM_SERVICE_NAME: z.string().nonempty(),
    APIM_PRODUCT_NAME: z.string().nonempty(),
  })
  .transform((env) => ({
    azureSubscriptionId: env.AZURE_SUBSCRIPTION_ID,
    apimResourceGroupName: env.APIM_RESOURCE_GROUP_NAME,
    apimServiceName: env.APIM_SERVICE_NAME,
    apimProductName: env.APIM_PRODUCT_NAME,
  }));

export const getApimConfig = () => {
  const result = Config.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing apim config", {
      cause: result.error.issues,
    });
  }
  return result.data;
};

const apimConfig = getApimConfig();
let apimClient: ApiManagementClient | null = null;

export const getApimClient = () => {
  if (!apimClient) {
    apimClient = new ApiManagementClient(
      new DefaultAzureCredential(),
      apimConfig.azureSubscriptionId
    );
  }
  return apimClient;
};
