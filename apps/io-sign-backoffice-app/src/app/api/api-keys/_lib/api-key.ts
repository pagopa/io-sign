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

type ApiKey = ApiKeyBody & {
  id: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
};

const ApiKey = (apiKey: ApiKeyBody & { id: string }): ApiKey => ({
  ...apiKey,
  status: "ACTIVE",
  createdAt: new Date(),
});

export class ApiKeyAlreadyExistsError extends Error {
  constructor(cause = {}) {
    super("the API key already exists");
    this.name = "ApiKeyAlreadyExistsError";
    this.cause = cause;
  }
}

async function createApimSubscription(id: string, displayName: string) {
  try {
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
  } catch (e) {
    throw new Error("unable to create the API key", {
      cause: e,
    });
  }
}

async function deleteApimSubscription(subscriptionId: string) {
  try {
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
  } catch (e) {
    throw new Error("unable to create the API key", {
      cause: e,
    });
  }
}

async function apiKeyExists(institutionId: string, displayName: string) {
  try {
    const apiKeys = await getApiKeys(institutionId, { displayName });
    if (apiKeys.length !== 0) {
      throw new ApiKeyAlreadyExistsError(
        "such name already exists for the institution"
      );
    }
  } catch (e) {
    throw e instanceof ApiKeyAlreadyExistsError
      ? e
      : new Error("unable to create the API key", { cause: e });
  }
}

async function insertApiKey(apiKey: ApiKey) {
  try {
    const { cosmosContainerName } = getCosmosConfig();
    await getCosmosContainer(cosmosContainerName).items.create(apiKey);
  } catch (e) {
    await deleteApimSubscription(apiKey.id);
    throw new Error("unable to create the API key", {
      cause: e,
    });
  }
}

async function getApiKeys(
  institutionId: string,
  queryFilters: {
    environment?: Environment;
    displayName?: string;
  }
): Promise<ApiKey[]> {
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

  return resources;
}

export async function getApiKey(
  id: string,
  institutionId: string
): Promise<ApiKey & { key: string }> {
  try {
    const { cosmosContainerName } = getCosmosConfig();
    const { resource } = await getCosmosContainer(cosmosContainerName)
      .item(id, institutionId)
      .read();
    const {
      apim: { resourceGroupName, serviceName },
    } = getApimConfig();
    const apimClient = getApimClient();
    const { primaryKey } = await apimClient.subscription.listSecrets(
      resourceGroupName,
      serviceName,
      id
    );
    return { ...resource, key: primaryKey };
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
    const {
      apim: { resourceGroupName, serviceName },
    } = getApimConfig();
    const apimClient = getApimClient();
    const result: (ApiKey & { key: string })[] = [];
    for (const apiKey of apiKeys) {
      const { primaryKey } = await apimClient.subscription.listSecrets(
        resourceGroupName,
        serviceName,
        apiKey.id
      );

      result.push({
        id: apiKey.id,
        key: primaryKey ?? "",
        institutionId,
        displayName: apiKey.displayName,
        environment,
        status: apiKey.status,
        createdAt: apiKey.createdAt,
      });
    }

    return result;
  } catch (e) {
    throw new Error("unable to get the API keys", { cause: e });
  }
}

export async function createApiKey(apiKeyBody: ApiKeyBody) {
  // check if the api key for the given input already exists
  await apiKeyExists(apiKeyBody.institutionId, apiKeyBody.displayName);
  const apiKeyId = ulid();
  const key = await createApimSubscription(apiKeyId, apiKeyBody.displayName);
  const apiKey = ApiKey({ id: apiKeyId, ...apiKeyBody });
  await insertApiKey(apiKey);

  return {
    id: apiKeyId,
    key,
  };
}
