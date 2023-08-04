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

type Config = z.infer<typeof Config>;

class ApimProductClient {
  private client: ApiManagementClient;
  private subscriptionId: string;
  private resourceGroupName: string;
  private serviceName: string;
  private productName: string;

  constructor(config: Config) {
    const {
      azure: { subscriptionId },
      apim: { resourceGroupName, serviceName, productName },
    } = config;
    this.subscriptionId = subscriptionId;
    this.resourceGroupName = resourceGroupName;
    this.serviceName = serviceName;
    this.productName = productName;
    this.client = new ApiManagementClient(
      new DefaultAzureCredential(),
      subscriptionId
    );
  }

  async getSecret(id: string): Promise<string | undefined> {
    const { primaryKey } = await this.client.subscription.listSecrets(
      this.resourceGroupName,
      this.serviceName,
      id
    );
    return primaryKey;
  }

  async createSubscription(
    id: string,
    displayName: string
  ): Promise<string | undefined> {
    const { primaryKey } = await this.client.subscription.createOrUpdate(
      this.resourceGroupName,
      this.serviceName,
      id,
      {
        displayName,
        scope: `/subscriptions/${this.subscriptionId}/resourceGroups/${this.productName}/providers/Microsoft.ApiManagement/service/${this.serviceName}/products/${this.productName}`,
      }
    );
    return primaryKey;
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    await this.client.subscription.delete(
      this.resourceGroupName,
      this.serviceName,
      subscriptionId,
      "*"
    );
  }

  async getProduct() {
    await this.client.product.get(
      this.resourceGroupName,
      this.serviceName,
      this.productName
    );
  }
}

const getApimConfig = cache(() => {
  const result = Config.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing apim config", {
      cause: result.error.issues,
    });
  }
  return result.data;
});

export const getApimClient = cache(() => {
  const config = getApimConfig();
  return new ApimProductClient(config);
});

export async function getApimHealth() {
  try {
    await getApimClient().getProduct();
  } catch {
    throw "apim";
  }
}
