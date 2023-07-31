import { z } from "zod";
import { ulid } from "ulid";
import { getApimClient, getApimConfig } from "./apim";
import { getCosmosClient, getCosmosConfig } from "@/lib/cosmos";

export const ApiKeyBody = z.object({
  institutionId: z.string().nonempty(),
  displayName: z.string().nonempty(),
  environment: z.enum(["TEST", "DEFAULT", "INTERNAL"]),
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

async function getApiKey(displayName: string, institutionId: string) {
  try {
    const { cosmosDbName, cosmosContainerName } = getCosmosConfig();
    const cosmosClient = getCosmosClient();
    const { resources } = await cosmosClient
      .database(cosmosDbName)
      .container(cosmosContainerName)
      .items.query({
        parameters: [
          {
            name: "@displayName",
            value: displayName,
          },
          {
            name: "@institutionId",
            value: institutionId,
          },
        ],
        query:
          "SELECT * FROM c WHERE c.displayName = @displayName AND c.institutionId = @institutionId",
      })
      .fetchAll();
    if (resources.length !== 0) {
      throw new ApiKeyAlreadyExistsError();
    }
  } catch (e) {
    throw e instanceof ApiKeyAlreadyExistsError
      ? e
      : new Error("unable to create the API key", { cause: e });
  }
}

async function insertApiKey(apiKey: ApiKey) {
  try {
    const { cosmosDbName, cosmosContainerName } = getCosmosConfig();
    const cosmosClient = getCosmosClient();
    await cosmosClient
      .database(cosmosDbName)
      .container(cosmosContainerName)
      .items.create(apiKey);
  } catch (e) {
    await deleteApimSubscription(apiKey.id);
    throw new Error("unable to create the API key", {
      cause: e,
    });
  }
}

async function createApimSubscription(resourceId: string, displayName: string) {
  try {
    const { azure, apim } = getApimConfig();
    const { resourceGroupName, serviceName, productName } = apim;
    const apimClient = getApimClient();
    const { primaryKey } = await apimClient.subscription.createOrUpdate(
      resourceGroupName,
      serviceName,
      resourceId,
      {
        displayName,
        scope: `/subscriptions/${azure.subscriptionId}/resourceGroups/${productName}/providers/Microsoft.ApiManagement/service/${serviceName}/products/${productName}`,
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
    const { apim } = getApimConfig();
    const { resourceGroupName, serviceName } = apim;
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

export async function createApiKey(apiKeyBody: ApiKeyBody) {
  // check if the api key for the given input already exists
  await getApiKey(apiKeyBody.displayName, apiKeyBody.institutionId);
  const apiKeyId = ulid();
  const key = await createApimSubscription(apiKeyId, apiKeyBody.displayName);
  const apiKey = ApiKey({ id: apiKeyId, ...apiKeyBody });
  await insertApiKey(apiKey);

  return {
    id: apiKeyId,
    key,
  };
}
