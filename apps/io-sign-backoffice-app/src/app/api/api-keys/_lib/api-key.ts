import { z } from "zod";
import { ulid } from "ulid";

import { getApimClient, getApimConfig } from "@/lib/apim";
import { getCosmosConfig, getCosmosContainer } from "@/lib/cosmos";

const Environment = z.enum(["TEST", "DEFAULT", "INTERNAL"]);

type Environment = z.infer<typeof Environment>;

export const ApiKeyBody = z.object({
  institutionId: z.string().uuid(),
  displayName: z.string().nonempty(),
  environment: Environment,
});

type ApiKeyBody = z.infer<typeof ApiKeyBody>;

export const ApiKeyWithUnexposedSecret = ApiKeyBody.extend({
  id: z.string().nonempty(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  createdAt: z.string().datetime(),
});

type ApiKeyWithUnexposedSecret = z.infer<typeof ApiKeyWithUnexposedSecret>;

const ApiKeyWithExposedSecret = ApiKeyWithUnexposedSecret.extend({
  key: z.string().nonempty(),
});

type ApiKeyWithExposedSecret = z.infer<typeof ApiKeyWithExposedSecret>;

const ApiKey = (
  apiKeyBody: ApiKeyBody & { id: string }
): ApiKeyWithUnexposedSecret => ({
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

async function getSecret(id: string): Promise<string | undefined> {
  const apimClient = getApimClient();
  const {
    apim: { resourceGroupName, serviceName },
  } = getApimConfig();
  const { primaryKey } = await apimClient.subscription.listSecrets(
    resourceGroupName,
    serviceName,
    id
  );
  return primaryKey;
}

async function exposeSecret(
  apiKey: ApiKeyWithUnexposedSecret
): Promise<ApiKeyWithExposedSecret> {
  const primaryKey = await getSecret(apiKey.id);
  const key = z.string().parse(primaryKey);
  return { ...apiKey, key };
}

async function createApimSubscription(
  id: string,
  displayName: string
): Promise<string> {
  const {
    azure: { subscriptionId },
    apim: { resourceGroupName, serviceName, productName },
  } = getApimConfig();
  const apimClient = getApimClient();
  const { primaryKey } = await apimClient.subscription.createOrUpdate(
    resourceGroupName,
    serviceName,
    id,
    {
      displayName,
      scope: `/subscriptions/${subscriptionId}/resourceGroups/${productName}/providers/Microsoft.ApiManagement/service/${serviceName}/products/${productName}`,
    }
  );
  if (!primaryKey) {
    throw new Error("primary key is undefined");
  }
  return primaryKey;
}

async function deleteApimSubscription(subscriptionId: string): Promise<void> {
  const {
    apim: { resourceGroupName, serviceName },
  } = getApimConfig();
  const apimClient = getApimClient();
  await apimClient.subscription.delete(
    resourceGroupName,
    serviceName,
    subscriptionId,
    "*"
  );
}

async function getApiKeys(
  institutionId: string,
  queryFilters: {
    environment?: Environment;
    displayName?: string;
  }
): Promise<ApiKeyWithUnexposedSecret[]> {
  const { cosmosContainerName } = getCosmosConfig();
  let query = "SELECT * FROM c WHERE c.institutionId = @institutionId";
  const parameters = [
    {
      name: "@institutionId",
      value: institutionId,
    },
  ];

  if (queryFilters.environment) {
    parameters.push({
      name: "@environment",
      value: queryFilters.environment,
    });
    query = query.concat(" AND c.environment = @environment");
  }
  if (queryFilters.displayName) {
    parameters.push({ name: "@displayName", value: queryFilters.displayName });
    query = query.concat(" AND c.displayName = @displayName");
  }

  const { resources } = await getCosmosContainer(cosmosContainerName)
    .items.query({
      parameters,
      query,
    })
    .fetchAll();
  const apiKeys = ApiKeyWithUnexposedSecret.array().parse(resources);
  return apiKeys;
}

async function apiKeyExists(
  institutionId: string,
  displayName: string
): Promise<boolean> {
  const apiKeys = await getApiKeys(institutionId, { displayName });
  return apiKeys.length !== 0;
}

async function insertApiKey(apiKey: ApiKeyWithUnexposedSecret): Promise<void> {
  const { cosmosContainerName } = getCosmosConfig();
  await getCosmosContainer(cosmosContainerName).items.create(apiKey);
}

export async function getApiKey(
  id: string,
  institutionId: string
): Promise<ApiKeyWithExposedSecret> {
  try {
    const { cosmosContainerName } = getCosmosConfig();
    const { resource } = await getCosmosContainer(cosmosContainerName)
      .item(id, institutionId)
      .read();
    const apiKey = ApiKeyWithUnexposedSecret.parse(resource);
    return exposeSecret(apiKey);
  } catch (e) {
    throw new Error("unable to get the API key", { cause: e });
  }
}

export async function listApiKeys(
  institutionId: string,
  environment: Environment
) {
  try {
    const apiKeys = await getApiKeys(institutionId, { environment });
    return Promise.all(apiKeys.map(exposeSecret));
  } catch (e) {
    throw new Error("unable to get the API keys", { cause: e });
  }
}

export async function createApiKey(apiKeyBody: ApiKeyBody) {
  // check if the api key for the given input already exists
  try {
    const apiKeyAlreadyExists = await apiKeyExists(
      apiKeyBody.institutionId,
      apiKeyBody.displayName
    );
    if (apiKeyAlreadyExists) {
      throw new ApiKeyAlreadyExistsError(
        "such name already exists for the institution"
      );
    }
  } catch (e) {
    throw e instanceof ApiKeyAlreadyExistsError
      ? e
      : new Error("unable to create the API key", { cause: e });
  }

  const apiKeyId = ulid();
  let key: string;
  try {
    key = await createApimSubscription(apiKeyId, apiKeyBody.displayName);
  } catch (e) {
    throw new Error("unable to create the API key", { cause: e });
  }
  const apiKey = ApiKey({
    id: apiKeyId,
    ...apiKeyBody,
  });
  try {
    await insertApiKey(apiKey);
  } catch (e) {
    try {
      await deleteApimSubscription(apiKey.id);
    } catch (e) {
      throw new Error("unable to create the API key", { cause: e });
    }
    throw new Error("unable to create the API key", { cause: e });
  }
  return {
    id: apiKeyId,
    key,
  };
}

export async function createApiKey2(apiKeyBody: ApiKeyBody) {
  // check if the api key for the given input already exists
  try {
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
    const key = await createApimSubscription(apiKeyId, apiKeyBody.displayName);
    const apiKey = ApiKey({
      id: apiKeyId,
      ...apiKeyBody,
    });
    try {
      await insertApiKey(apiKey);
    } catch (e) {
      await deleteApimSubscription(apiKey.id);
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
