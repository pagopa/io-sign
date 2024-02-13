import { z } from "zod";

import {
  Institution,
  institutionDetailSchema,
  userSchema,
} from "@io-sign/io-sign/institution";

import { InstitutionRepository } from "@/institution";
import { UserRepository } from "@/user";

const ConfigFromEnvironment = z
  .object({
    SELFCARE_API_URL: z
      .string()
      .url()
      .default("https://api.selfcare.pagopa.it"),
    SELFCARE_API_KEY: z.string().min(1),
  })
  .transform((env) => ({
    baseURL: env.SELFCARE_API_URL,
    apiKey: env.SELFCARE_API_KEY,
  }));

export type SelfcareApiClientConfig = z.infer<typeof ConfigFromEnvironment>;

export const getSelfcareApiClientConfigFromEnvironment = () => {
  const result = ConfigFromEnvironment.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing SelfcareApiClient config", {
      cause: result.error.issues,
    });
  }
  return result.data;
};

export class SelfcareApiClient
  implements InstitutionRepository, UserRepository
{
  #baseURL: string;
  #options: RequestInit;

  constructor(opts: SelfcareApiClientConfig) {
    this.#baseURL = opts.baseURL;
    this.#options = {
      headers: {
        "Ocp-Apim-Subscription-Key": opts.apiKey,
        Accept: "application/json",
      },
      credentials: "omit",
    };
  }

  async getInstitutionById(id: string) {
    const resource = new URL(`external/v2/institutions/${id}`, this.#baseURL);
    try {
      const response = await fetch(resource, this.#options);
      if (response.status === 404) {
        return undefined;
      }
      const json = await response.json();
      return institutionDetailSchema.parse(json);
    } catch (cause) {
      throw new Error(`Unable to get institution from self care`, { cause });
    }
  }

  async getUsersByInstitutionId(institutionId: Institution["id"]) {
    const resource = new URL(
      `external/v2/institutions/${institutionId}/users?userIdForAuth=0`,
      this.#baseURL
    );
    try {
      const response = await fetch(resource, this.#options);
      if (response.status === 404) {
        return [];
      }
      const json = await response.json();
      return userSchema.array().parse(json);
    } catch (cause) {
      throw new Error("Unable to get institution users from self care", {
        cause,
      });
    }
  }
}
