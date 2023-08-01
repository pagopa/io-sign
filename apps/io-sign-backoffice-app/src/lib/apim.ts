import { z } from "zod";
import { DefaultAzureCredential } from "@azure/identity";
import { ApiManagementClient } from "@azure/arm-apimanagement";
import { cache } from "react";

const Config = z
  .object({
    AZURE_SUBSCRIPTION_ID: z.string().nonempty(),
    APIM_RESOURCE_GROUP_NAME: z.string().nonempty(),
    APIM_SERVICE_NAME: z.string().nonempty(),
    APIM_PRODUCT_NAME: z.string().nonempty(),
  })
  .transform((env) => ({
    azure: { subscriptionId: env.AZURE_SUBSCRIPTION_ID },
    apim: {
      resourceGroupName: env.APIM_RESOURCE_GROUP_NAME,
      serviceName: env.APIM_SERVICE_NAME,
      productName: env.APIM_PRODUCT_NAME,
    },
  }));

export const getApimConfig = cache(() => {
  const result = Config.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing apim config", {
      cause: result.error.issues,
    });
  }
  return result.data;
});

export const getApimClient = cache(
  () =>
    new ApiManagementClient(
      new DefaultAzureCredential(),
      getApimConfig().azure.subscriptionId
    )
);

export async function getApimHealth() {
  try {
    const apim = getApimClient();
    const {
      apim: { resourceGroupName, serviceName, productName },
    } = getApimConfig();
    await apim.product.get(resourceGroupName, serviceName, productName);
  } catch {
    throw "apim";
  }
}
