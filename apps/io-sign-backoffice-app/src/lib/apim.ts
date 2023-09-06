import { z } from "zod";
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

type Method = "GET" | "POST" | "PUT" | "DELETE";

class ApimProductClient {
  #accessToken: string;
  #subscriptionId: string;
  #resourceGroupName: string;
  #serviceName: string;
  #productName: string;

  constructor(config: Config) {
    const {
      azure: { subscriptionId },
      apim: { accessToken, resourceGroupName, serviceName, productName },
    } = config;
    this.#subscriptionId = subscriptionId;
    this.#accessToken = accessToken;
    this.#resourceGroupName = resourceGroupName;
    this.#serviceName = serviceName;
    this.#productName = productName;
  }

  async #fetch(path: string, method: Method = "GET", body?: string) {
    const url = `https://${
      this.#serviceName
    }.management.azure-api.net/subscriptions/${
      this.#subscriptionId
    }/resourceGroups/${
      this.#resourceGroupName
    }/providers/Microsoft.ApiManagement/service/${
      this.#serviceName
    }${path}/?api-version=2022-08-01`;

    const resp = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: this.#accessToken,
      },
      method,
      body,
    });
    if (!resp.ok) {
      throw new Error("Something went wrong");
    }
    const json = await resp.json();
    return json;
  }

  async getSecret(id: string): Promise<string> {
    const res = await this.#fetch(`/subscriptions/${id}/listSecrets`, "POST");
    return z
      .object({
        primaryKey: z.string(),
      })
      .parse(res).primaryKey;
  }

  async createSubscription(id: string, displayName: string): Promise<string> {
    const res = await this.#fetch(
      `/subscriptions/${id}`,
      "PUT",
      JSON.stringify({
        properties: {
          displayName,
          scope: `/products/${this.#productName}`,
        },
      })
    );
    return z
      .object({
        properties: z.object({
          primaryKey: z.string(),
        }),
      })
      .parse(res).properties.primaryKey;
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    await this.#fetch(`/subscriptions/${subscriptionId}`, "DELETE");
  }

  async getProduct() {
    await this.#fetch(`/products/${this.#productName}`);
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
