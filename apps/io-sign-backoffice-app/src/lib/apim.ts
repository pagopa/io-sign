import { z } from "zod";
import { cache } from "react";
import { ApiManagementClient } from "@azure/arm-apimanagement";
import { DefaultAzureCredential } from "@azure/identity";

const Config = z
  .object({
    AZURE_SUBSCRIPTION_ID: z.string().nonempty(),
    APIM_RESOURCE_GROUP_NAME: z.string().nonempty(),
    APIM_SERVICE_NAME: z.string().nonempty(),
    APIM_PRODUCT_NAME: z.string().nonempty(),
  })
  .transform((env) => ({
    subscriptionId: env.AZURE_SUBSCRIPTION_ID,
    resourceGroupName: env.APIM_RESOURCE_GROUP_NAME,
    serviceName: env.APIM_SERVICE_NAME,
    productName: env.APIM_PRODUCT_NAME,
  }));

type Config = z.infer<typeof Config>;

class ApimProductClient {
  #config: Config;
  #apimClient: ApiManagementClient;

  constructor(config: Config) {
    this.#config = config;
    this.#apimClient = new ApiManagementClient(
      new DefaultAzureCredential(),
      this.#config.subscriptionId
    );
  }

  async getSecret(id: string): Promise<string> {
    try {
      const secret = await this.#apimClient.subscription.listSecrets(
        this.#config.resourceGroupName,
        this.#config.serviceName,
        id
      );
      const parsed = z
        .object({
          primaryKey: z.string().nonempty(),
        })
        .parse(secret);
      return parsed.primaryKey;
    } catch (cause) {
      throw new Error(
        "Error obtaining the Api Management Subscription Secret",
        { cause }
      );
    }
  }

  async createSubscription(id: string, displayName: string): Promise<string> {
    try {
      const subscription = await this.#apimClient.subscription.createOrUpdate(
        this.#config.resourceGroupName,
        this.#config.serviceName,
        id,
        {
          displayName,
          scope: `/products/${this.#config.productName}`,
        }
      );
      const parsed = z
        .object({
          primaryKey: z.string().nonempty(),
        })
        .parse(subscription);
      return parsed.primaryKey;
    } catch (cause) {
      throw new Error("Error creating the Api Management Subscription", {
        cause,
      });
    }
  }

  async deleteSubscription(id: string): Promise<void> {
    try {
      await this.#apimClient.subscription.delete(
        this.#config.resourceGroupName,
        this.#config.serviceName,
        id,
        "*"
      );
    } catch (cause) {
      throw new Error("Error deleting the Api Management Subscription", {
        cause,
      });
    }
  }

  async getProduct() {
    try {
      await this.#apimClient.product.get(
        this.#config.resourceGroupName,
        this.#config.serviceName,
        this.#config.productName
      );
    } catch (cause) {
      throw new Error("Unable to get the Api Management Product", {
        cause,
      });
    }
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
