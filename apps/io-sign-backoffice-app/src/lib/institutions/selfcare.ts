import { z } from "zod";

import {
  Institution,
  InstitutionDetail,
  Product,
  institutionDetailSchema,
  institutionSchema,
  productSchema,
} from "./index";

import { cache } from "react";
import { SUPPORT_L3_EMAIL_DEFAULT } from "../support";

// Ensure MSW interceptors are active in this module's scope to prevent race conditions during SSR
if (
  process.env.NEXT_PUBLIC_MOCK_MSW_ENABLED === "true" &&
  typeof window === "undefined" &&
  process.env.NODE_ENV === "development"
) {
  /**
   * Use dynamic require to prevent MSW from being bundled in the client-side
   * and to avoid side-effects during the Next.js build process.
   * This ensures MSW only patches Node.js primitives at runtime when
   * server-side mocking is explicitly required.
   */
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { startMSWServer } = require("../../../mocks/msw-node");
  startMSWServer();
}

const selfcareApiClientOptions = z.object({
  baseURL: z.string().url().default("https://api.selfcare.pagopa.it"),
  ocpApimSubscriptionKey: z.string().min(1),
  cache: z.object({
    lifetime: z.number().int().default(3600),
  }),
});

type SelfcareApiClientOptions = z.infer<typeof selfcareApiClientOptions>;

class SelfcareApiClient {
  #baseURL: string;
  #options: RequestInit;

  constructor(opts: SelfcareApiClientOptions) {
    this.#baseURL = opts.baseURL;
    this.#options = {
      headers: {
        "Ocp-Apim-Subscription-Key": opts.ocpApimSubscriptionKey,
        Accept: "application/json",
      },
      credentials: "omit",
      next: {
        revalidate: opts.cache.lifetime,
      },
    };
  }

  async getInstitutions(userId: string): Promise<Institution[]> {
    const resource = new URL(
      `external/v2/institutions?userIdForAuth=${userId}`,
      this.#baseURL,
    );
    try {
      const response = await fetch(resource, this.#options);
      if (response.status === 404) {
        return [];
      }
      const json = await response.json();
      return institutionSchema.array().parse(json);
    } catch (cause) {
      throw new Error("Unable to get institutions from self care", {
        cause,
      });
    }
  }

  async getInstitution(id: string): Promise<InstitutionDetail | undefined> {
    const resource = new URL(`external/v2/institutions/${id}`, this.#baseURL);
    try {
      const response = await fetch(resource, this.#options);
      if (response.status === 404) {
        return undefined;
      }
      const json = await response.json();
      if (
        process.env.NODE_ENV === "development" ||
        id === "4a4149af-172e-4950-9cc8-63ccc9a6d865"
      ) {
        json.supportEmail = SUPPORT_L3_EMAIL_DEFAULT;
      }
      return institutionDetailSchema.parse(json);
    } catch (cause) {
      throw new Error(`Unable to get institution from self care`, { cause });
    }
  }

  async getProducts(userId: string, institutionId: string): Promise<Product[]> {
    const resource = new URL(
      `external/v2/institutions/${institutionId}/products?userId=${userId}`,
      this.#baseURL,
    );
    try {
      const response = await fetch(resource, this.#options);
      if (response.status === 404) {
        return [];
      }
      const json = await response.json();
      return productSchema.array().parse(json);
    } catch (cause) {
      throw new Error("Unable to get institution products from self care", {
        cause,
      });
    }
  }
}

export const getSelfcareApiClient = cache(() => {
  const schema = z
    .object({
      SELFCARE_API_URL: z.string().url().optional(),
      SELFCARE_API_KEY: z.string().min(1),
      SELFCARE_API_CACHE_LIFETIME: z.number().int().optional(),
    })
    .transform((env) => ({
      baseURL: env.SELFCARE_API_URL,
      ocpApimSubscriptionKey: env.SELFCARE_API_KEY,
      cache: {
        lifetime: env.SELFCARE_API_CACHE_LIFETIME,
      },
    }));
  try {
    const env = schema.parse(process.env);
    const options = selfcareApiClientOptions.parse(env);
    return new SelfcareApiClient(options);
  } catch (cause) {
    throw new Error("Unable to parse the selfcare api client options", {
      cause,
    });
  }
});
