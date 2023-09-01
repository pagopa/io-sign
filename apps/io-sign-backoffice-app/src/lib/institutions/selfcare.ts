import { z } from "zod";
import { Institution, institutionSchema, productSchema } from "./index";

import { cache } from "react";

class SelfCareApiClient {
  #baseUrl: string;
  #apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.#baseUrl = baseUrl;
    this.#apiKey = apiKey;
  }

  async #fetch(uri: string) {
    const url = new URL(`external/v2/${uri}`, this.#baseUrl);
    const resp = await fetch(url, {
      headers: {
        "Ocp-Apim-Subscription-Key": this.#apiKey,
      },
    });
    const json = await resp.json();
    return json;
  }

  async getInstitutions(userId: string): Promise<Institution[]> {
    const res = await this.#fetch(`institutions/?userIdForAuth=${userId}`);
    return z.array(institutionSchema).parse(res);
  }

  async getInstitution(id: string): Promise<Institution> {
    const res = await this.#fetch(`institutions/${id}`);
    return institutionSchema.parse(res);
  }

  async getProducts(userId: string, institutionId: string) {
    const res = await this.#fetch(
      `institutions/${institutionId}/products?userId=${userId}`
    );
    return z.array(productSchema).parse(res);
  }
}

export const getSelfCareApiClient = cache(() => {
  const configSchema = z
    .object({
      SELFCARE_API_URL: z.string().url(),
      SELFCARE_API_KEY: z.string().nonempty(),
    })
    .transform((e) => ({
      baseUrl: e.SELFCARE_API_URL,
      apiKey: e.SELFCARE_API_KEY,
    }));
  const { baseUrl, apiKey } = configSchema.parse(process.env);
  return new SelfCareApiClient(baseUrl, apiKey);
});
