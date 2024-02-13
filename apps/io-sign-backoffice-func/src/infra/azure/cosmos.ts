import { z } from "zod";

import { Container, Database } from "@azure/cosmos";

import { ApiKey, apiKeySchema } from "@io-sign/io-sign/api-key";
import { issuerSchema } from "@io-sign/io-sign/issuer";
import { ApiKeyRepository } from "@/api-key";
import { IssuerKey, IssuerRepository } from "@/issuer";

const ConfigFromEnvironment = z
  .object({
    COSMOS_DB_CONNECTION_STRING: z.string().min(1),
    COSMOS_DB_NAME: z.string().min(1),
  })
  .transform((env) => ({
    cosmosDbConnectionString: env.COSMOS_DB_CONNECTION_STRING,
    cosmosDbName: env.COSMOS_DB_NAME,
  }));

export type CosmosDBConfig = z.infer<typeof ConfigFromEnvironment>;

export const getCosmosDBConfigFromEnvironment = () => {
  const result = ConfigFromEnvironment.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing CosmosDB config", {
      cause: result.error.issues,
    });
  }
  return result.data;
};

export class BackofficeEntitiesRepository
  implements ApiKeyRepository, IssuerRepository
{
  #apiKeysById: Container;
  #apiKeys: Container;
  #issuers: Container;

  constructor(db: Database) {
    this.#apiKeys = db.container("api-keys");
    this.#apiKeysById = db.container("api-keys-by-id");
    this.#issuers = db.container("issuers");
  }

  async getApiKeyById(id: ApiKey["id"]) {
    try {
      const apiKeyById = await this.#apiKeysById.item(id, id).read();
      const { institutionId } = apiKeySchema
        .pick({
          institutionId: true,
        })
        .parse(apiKeyById.resource);
      const apiKey = await this.#apiKeys.item(id, institutionId).read();
      return apiKeySchema.or(z.undefined()).parse(apiKey.resource);
    } catch (e) {
      throw new Error("Unable to get the Api Key from DB.", { cause: e });
    }
  }

  async getIssuerByKey(k: IssuerKey) {
    try {
      const item = await this.#issuers.item(k.id, k.institutionId).read();
      return issuerSchema.or(z.undefined()).parse(item.resource);
    } catch (cause) {
      throw new Error("Unable to get the Issuer from DB.", { cause });
    }
  }
}
