import { z } from "zod";
import { ulid } from "ulid";
import {
  SubscriptionCreationError,
  getApimClient,
  getApimConfig,
} from "./apim";
import {
  getCosmosClient,
  getCosmosConfig,
  CosmosDatabaseError,
} from "@/lib/cosmos";

export const ApiKeyBody = z.object({
  institutionId: z.string().nonempty(),
  displayName: z.string().nonempty(),
  environment: z.enum(["TEST", "DEFAULT", "INTERNAL"]),
  resourceId: z.string().nonempty(),
});

type ApiKeyBody = z.infer<typeof ApiKeyBody>;

type ApiKey = ApiKeyBody & {
  id: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
};

const ApiKey = (apiKey: ApiKeyBody): ApiKey => ({
  id: ulid(),
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

async function readApiKey({
  displayName,
  environment,
  institutionId,
}: ApiKeyBody) {
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
            name: "@environment",
            value: environment,
          },
          {
            name: "@institutionId",
            value: institutionId,
          },
        ],
        query:
          "SELECT * FROM c WHERE c.displayName = @displayName AND c.environment = @environment AND c.institutionId = @institutionId",
      })
      .fetchAll();
    if (resources.length !== 0) {
      throw new ApiKeyAlreadyExistsError();
    }
  } catch (e) {
    throw e instanceof ApiKeyAlreadyExistsError
      ? e
      : new CosmosDatabaseError("unable to create the API key", { cause: e });
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
    throw new CosmosDatabaseError("unable to create the API key", {
      cause: e,
    });
  }
}

async function createApimSubscription(resourceId: string, displayName: string) {
  try {
    const {
      azureSubscriptionId,
      apimResourceGroupName,
      apimServiceName,
      apimProductName,
    } = getApimConfig();
    const apimClient = getApimClient();
    const { primaryKey } = await apimClient.subscription.createOrUpdate(
      apimResourceGroupName,
      apimServiceName,
      resourceId,
      {
        displayName,
        scope: `/subscriptions/${azureSubscriptionId}/resourceGroups/${apimResourceGroupName}/providers/Microsoft.ApiManagement/service/${apimServiceName}/products/${apimProductName}`,
      }
    );
    if (!primaryKey) {
      throw new Error();
    }
    return primaryKey;
  } catch (e) {
    throw new SubscriptionCreationError({
      cause: e,
    });
  }
}

export async function createApiKey(apiKeyBody: ApiKeyBody) {
  // check if the api key for the given input already exists
  await readApiKey(apiKeyBody);
  const key = await createApimSubscription(
    apiKeyBody.resourceId,
    apiKeyBody.displayName
  );
  const apiKey = ApiKey(apiKeyBody);
  await insertApiKey(apiKey);

  return {
    id: apiKey.id,
    key,
  };
}
