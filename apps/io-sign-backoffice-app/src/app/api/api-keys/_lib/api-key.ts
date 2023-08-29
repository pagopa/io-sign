import { z } from "zod";
import { ulid } from "ulid";

import { getApimClient } from "@/lib/apim";
import { getCosmosConfig, getCosmosContainerClient } from "@/lib/cosmos";
import { FeedResponse } from "@azure/cosmos";

export const ApiKeyBody = z.object({
  institutionId: z.string().uuid(),
  displayName: z.string().nonempty(),
  environment: z.enum(["TEST", "DEFAULT", "INTERNAL"]),
});

type ApiKeyBody = z.infer<typeof ApiKeyBody>;

export const ApiKey = ApiKeyBody.extend({
  id: z.string().nonempty(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  createdAt: z.string().datetime(),
});

type ApiKey = z.infer<typeof ApiKey>;

const ApiKeyWithExposedSecret = ApiKey.extend({
  key: z.string().nonempty(),
});

type ApiKeyWithExposedSecret = z.infer<typeof ApiKeyWithExposedSecret>;

const ApiKeyWithUnexposedSecret = (
  apiKeyBody: ApiKeyBody & { id: string }
): ApiKey => ({
  ...apiKeyBody,
  status: "ACTIVE",
  createdAt: new Date().toISOString(),
});

export class ApiKeyAlreadyExistsError extends Error {
  constructor(cause = {}) {
    super("the API key already exists");
    this.name = "ApiKeyAlreadyExistsError";
    this.cause = cause;
  }
}

async function exposeSecret(apiKey: ApiKey): Promise<ApiKeyWithExposedSecret> {
  const key = await getApimClient().getSecret(apiKey.id);
  return { ...apiKey, key };
}

async function* getApiKeys(institutionId: string, displayName?: string) {
  const { cosmosContainerName } = getCosmosConfig();
  let query = "SELECT * FROM c WHERE c.institutionId = @institutionId";
  const parameters = [
    {
      name: "@institutionId",
      value: institutionId,
    },
  ];

  if (displayName) {
    parameters.push({ name: "@displayName", value: displayName });
    query = query.concat(" AND c.displayName = @displayName");
  }

  const cosmosResponse: AsyncIterable<FeedResponse<ApiKey>> =
    getCosmosContainerClient(cosmosContainerName)
      .items.query({
        parameters,
        query,
      })
      .getAsyncIterator();

  for await (const { resources } of cosmosResponse) {
    for (const resource of resources) {
      yield ApiKey.parse(resource);
    }
  }
}

async function apiKeyExists(
  institutionId: string,
  displayName: string
): Promise<boolean> {
  const apiKeys = getApiKeys(institutionId, displayName);
  const item = await apiKeys.next();
  return !item.done;
}

async function insertApiKey(apiKey: ApiKey): Promise<void> {
  const { cosmosContainerName } = getCosmosConfig();
  await getCosmosContainerClient(cosmosContainerName).items.create(apiKey);
}

export async function getApiKey(
  id: string,
  institutionId: string
): Promise<ApiKeyWithExposedSecret> {
  try {
    const { cosmosContainerName } = getCosmosConfig();
    const { resource } = await getCosmosContainerClient(cosmosContainerName)
      .item(id, institutionId)
      .read();
    const apiKey = ApiKey.parse(resource);
    return exposeSecret(apiKey);
  } catch (e) {
    throw new Error("unable to get the API key", { cause: e });
  }
}

export async function* listApiKeys(institutionId: string) {
  try {
    const apiKeys = getApiKeys(institutionId);
    for await (const apiKey of apiKeys) {
      yield exposeSecret(apiKey);
    }
  } catch (e) {
    throw new Error("unable to get the API keys", { cause: e });
  }
}

export async function createApiKey(apiKeyBody: ApiKeyBody) {
  try {
    // check if the api key for the given input already exists
    const apiKeyAlreadyExists = await apiKeyExists(
      apiKeyBody.institutionId,
      apiKeyBody.displayName
    );
    if (apiKeyAlreadyExists) {
      throw new ApiKeyAlreadyExistsError(
        "such name already exists for the institution"
      );
    }
    const apiKeyId = ulid();
    const key = await getApimClient().createSubscription(
      apiKeyId,
      apiKeyBody.displayName
    );
    const apiKey = ApiKeyWithUnexposedSecret({
      id: apiKeyId,
      ...apiKeyBody,
    });
    try {
      await insertApiKey(apiKey);
    } catch (e) {
      await getApimClient().deleteSubscription(apiKey.id);
      throw new Error("unable to create the API key", { cause: e });
    }
    return {
      id: apiKeyId,
      key,
    };
  } catch (e) {
    throw e instanceof ApiKeyAlreadyExistsError
      ? e
      : new Error("unable to create the API key", { cause: e });
  }
}
