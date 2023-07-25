import { z } from "zod";
import { id as newId } from "@io-sign/io-sign/id";
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
import { ParsingInputError } from "@/lib/error";

const ApiKeyBody = z.object({
  institutionId: z.string().nonempty(),
  displayName: z.string().nonempty(),
  environment: z.enum(["TEST", "DEFAULT", "INTERNAL"]),
  resourceId: z.string().nonempty(),
});

type ApiKeyBody = z.infer<typeof ApiKeyBody>;

type ApiKey = ApiKeyBody & {
  id: string;
  status: "ACTIVE" | "INACTIVE";
};

const newApiKey = (apiKey: ApiKeyBody): ApiKey => ({
  id: newId(),
  ...apiKey,
  status: "ACTIVE",
});

const parseApiKeyBody = (x: unknown): ApiKeyBody => {
  const result = ApiKeyBody.safeParse(x);
  if (!result.success) {
    throw new ParsingInputError({
      cause: result.error.issues,
    });
  }

  return result.data;
};

class ApiKeyAlreadyExistsError extends Error {
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
  const { dbName, containerName } = getCosmosConfig();
  const cosmosClient = getCosmosClient();
  await cosmosClient
    .database(dbName)
    .container(containerName)
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
    .fetchAll()
    .then(({ resources }) => {
      if (resources.length !== 0) {
        throw new ApiKeyAlreadyExistsError();
      }
    })
    .catch((e) => {
      throw e.name !== "ApiKeyAlreadyExistsError"
        ? new CosmosDatabaseError("unable to create the API key", { cause: e })
        : e;
    });
}

async function insertApiKey(apiKey: ApiKey) {
  const { dbName, containerName } = getCosmosConfig();
  const cosmosClient = getCosmosClient();
  await cosmosClient
    .database(dbName)
    .container(containerName)
    .items.create(apiKey)
    .catch((e) => {
      throw new CosmosDatabaseError("unable to create the API key", {
        cause: e,
      });
    });
}

async function createApimSubscription(resourceId: string, displayName: string) {
  const { subscriptionId, resourceGroupName, serviceName, productName } =
    getApimConfig();
  const apimClient = getApimClient();

  return apimClient.subscription
    .createOrUpdate(resourceGroupName, serviceName, resourceId, {
      displayName,
      scope: `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.ApiManagement/service/${serviceName}/products/${productName}`,
    })
    .then(({ primaryKey }) => {
      if (!primaryKey) {
        throw new Error();
      }
      return primaryKey;
    })
    .catch((e) => {
      throw new SubscriptionCreationError({
        cause: e,
      });
    });
}

export async function addApiKey(request: Request) {
  return (
    request
      .json()
      .then(parseApiKeyBody)
      // check if the api key for the given input already exists
      .then(async (apiKey) => {
        await readApiKey(apiKey);
        return apiKey;
      })
      .then(async (apiKey) => {
        const primaryKey = await createApimSubscription(
          apiKey.resourceId,
          apiKey.displayName
        );
        return { ...apiKey, primaryKey };
      })
      .then(({ primaryKey, ...apiKey }) => ({
        apiKey: newApiKey(apiKey),
        primaryKey,
      }))
      .then(async ({ apiKey, primaryKey }) => {
        await insertApiKey(apiKey);
        return { id: apiKey.id, primaryKey };
      })
  );
}
