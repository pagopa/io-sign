import { z } from "zod";
import { DefaultAzureCredential } from "@azure/identity";
import { ApiManagementClient } from "@azure/arm-apimanagement";
import { cache } from "react";

const Config = z
  .object({
    AZURE_SUBSCRIPTION_ID: z.string().nonempty(),
    APIM_ACCESS_TOKEN: z.string().nonempty(),
    APIM_RESOURCE_GROUP_NAME: z.string().nonempty(),
    APIM_SERVICE_NAME: z.string().nonempty(),
    APIM_PRODUCT_NAME: z.string().nonempty(),
  })
  .transform((env) => ({
    azure: { subscriptionId: env.AZURE_SUBSCRIPTION_ID },
    apim: {
      accessToken: env.APIM_ACCESS_TOKEN,
      resourceGroupName: env.APIM_RESOURCE_GROUP_NAME,
      serviceName: env.APIM_SERVICE_NAME,
      productName: env.APIM_PRODUCT_NAME,
    },
  }));

type Config = z.infer<typeof Config>;

class ApimProductClient {
  private accessToken: string;
  private subscriptionId: string;
  private resourceGroupName: string;
  private serviceName: string;
  private productName: string;

  constructor(config: Config) {
    const {
      azure: { subscriptionId },
      apim: { accessToken, resourceGroupName, serviceName, productName },
    } = config;
    this.subscriptionId = subscriptionId;
    this.accessToken = accessToken;
    this.resourceGroupName = resourceGroupName;
    this.serviceName = serviceName;
    this.productName = productName;
  }

  async getSecret(id: string): Promise<string> {
    const url = `https://iosignbackofficedev.management.azure-api.net/subscriptions/${this.subscriptionId}/resourceGroups/${this.resourceGroupName}/providers/Microsoft.ApiManagement/service/${this.serviceName}/subscriptions/${id}/listSecrets?api-version=2022-08-01`;

    const res = await fetch(url, {
      headers: {
        Authorization: this.accessToken,
      },
      method: "POST",
    });
    if (!res.ok) {
      throw new Error("error getting primary key on apim");
    }

    const body = await res.json();
    const parsedBody = z
      .object({
        primaryKey: z.string(),
        secondaryKey: z.string(),
      })
      .parse(body);
    return parsedBody.primaryKey;
  }

  async createSubscription(id: string, displayName: string): Promise<string> {
    const url = `https://iosignbackofficedev.management.azure-api.net/subscriptions/${this.subscriptionId}/resourceGroups/${this.resourceGroupName}/providers/Microsoft.ApiManagement/service/${this.serviceName}/subscriptions/${id}?api-version=2022-08-01`;

    const res = await fetch(url, {
      headers: {
        Authorization: this.accessToken,
        Accept: "application/json, text/plain",
        "Content-Type": "application/json",
      },
      method: "PUT",
      body: JSON.stringify({
        properties: {
          displayName,
          scope: `/products/${this.productName}`,
        },
      }),
    });
    if (!res.ok) {
      throw new Error("error creating subscription on apim");
    }
    const body = await res.json();
    const parsedBody = z
      .object({
        properties: z.object({
          primaryKey: z.string(),
        }),
      })
      .parse(body);
    return parsedBody.properties.primaryKey;
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    const url = `https://iosignbackofficedev.management.azure-api.net/subscriptions/${this.subscriptionId}/resourceGroups/${this.resourceGroupName}/providers/Microsoft.ApiManagement/service/${this.serviceName}/subscriptions/${subscriptionId}?api-version=2022-08-01`;

    const res = await fetch(url, {
      headers: {
        Authorization: this.accessToken,
      },
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error("error deleting subscription on apim");
    }
  }

  async getProduct() {
    const url = `https://iosignbackofficedev.management.azure-api.net/subscriptions/${this.subscriptionId}/resourceGroups/${this.resourceGroupName}/providers/Microsoft.ApiManagement/service/${this.serviceName}/products/${this.productName}?api-version=2022-08-01`;

    const res = await fetch(url, {
      headers: {
        Authorization: this.accessToken,
      },
      method: "GET",
    });
    if (!res.ok) {
      throw new Error("error getting product on apim");
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
