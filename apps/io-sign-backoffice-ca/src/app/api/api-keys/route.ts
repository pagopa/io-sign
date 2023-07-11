import { ApiKey, ApiKeyBody, apiKeyBody, newApiKey } from "@/api-key";
import { NextResponse } from "next/server";
import { DefaultAzureCredential } from "@azure/identity";
import { ApiManagementClient } from "@azure/arm-apimanagement";
import { z } from "zod";
import { CosmosClient } from "@azure/cosmos";

const loadCredentialsFromEnvironment = () =>
  z
    .object({
      SUBSCRIPTION_ID: z.string().nonempty(),
      RESOURCE_GROUP_NAME: z.string().nonempty(),
      SERVICE_NAME: z.string().nonempty(),
      PRODUCT_NAME: z.string().nonempty(),
      ACCOUNT_ENDPOINT: z.string().nonempty(),
      ACCOUNT_KEY: z.string().nonempty(),
    })
    .transform((env) => ({
      subscriptionId: env.SUBSCRIPTION_ID,
      resourceGroupName: env.RESOURCE_GROUP_NAME,
      serviceName: env.SERVICE_NAME,
      productName: env.PRODUCT_NAME,
      accountEndpoint: env.ACCOUNT_ENDPOINT,
      accountKey: env.ACCOUNT_KEY,
    }))
    .parse(process.env);

class SubscriptionCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubscriptionCreationError";
  }
}

class ResouceAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResouceAlreadyExistsError";
  }
}

// già è presente in io-sign
class CosmosDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CosmosDatabaseError";
  }
}

class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

const createCosmosClient = (endpoint: string, key: string) =>
  new CosmosClient({ endpoint, key });

const { accountEndpoint, accountKey } = loadCredentialsFromEnvironment();
const cosmosClient = createCosmosClient(accountEndpoint, accountKey);

// vado sul db a vedere se per (displayName, env, instId esiste già)
async function readApiKey({
  displayName,
  environment,
  institutionId,
}: ApiKeyBody) {
  try {
    await cosmosClient
      .database("io-sign-backoffice")
      .container("api-keys")
      .items.query(
        `SELECT * FROM c WHERE c.displayName = "${displayName}" AND c.environment = "${environment}" AND c.institutionId = "${institutionId}"`
      )
      .fetchAll()
      .then((items) => {
        if (items.resources.length !== 0) {
          throw new ResouceAlreadyExistsError("resource already exists error");
        }
      });
  } catch (error) {
    throw new CosmosDatabaseError("cosmos database error message");
  }
}

async function insertApiKey(apiKey: ApiKey) {
  try {
    await cosmosClient
      .database("io-sign-backoffice")
      .container("api-keys")
      .items.create(apiKey);
    return apiKey; // return quello che ho inserito?
  } catch {
    throw new CosmosDatabaseError("cosmos database error message");
  }
}

const createAPIMClient = (subscriptionId: string) =>
  new ApiManagementClient(new DefaultAzureCredential(), subscriptionId);

async function createAPIMSubscription(resourceId: string, displayName: string) {
  const { subscriptionId, resourceGroupName, serviceName, productName } =
    loadCredentialsFromEnvironment();

  return createAPIMClient(subscriptionId)
    .subscription.createOrUpdate(resourceGroupName, serviceName, resourceId, {
      displayName,
      scope: `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.ApiManagement/service/${serviceName}/products/${productName}`,
    })
    .then((x) => {
      const primaryKey = x.primaryKey;
      if (!primaryKey) {
        throw new SubscriptionCreationError(
          "subscription creation error message"
        );
      }
      return primaryKey;
    })
    .catch(() => {
      throw new SubscriptionCreationError(
        "subscription creation error message"
      );
    });
}

const getResponseFromError = (e: Error) => {
  switch (e.name) {
    case "ParseError":
      return NextResponse.json({ error: "parse Problem" }, { status: 400 });
    case "SubscriptionCreationError":
      return NextResponse.json({ error: "APIM Problem" }, { status: 500 });
    case "CosmosDatabaseError":
      return NextResponse.json({ error: "Database Problem" }, { status: 500 });
    case "ResouceAlreadyExistsError":
      return NextResponse.json(
        { error: "Resource already exists" },
        { status: 409 }
      );
  }
};

const parseApiKeyBody = (x: unknown): ApiKeyBody => {
  try {
    return apiKeyBody.parse(x);
  } catch {
    // mi perdo info qui. mettere in "cause"
    throw new ParseError("parse error message");
  }
};

// manca 409
export async function POST(request: Request) {
  return (
    request
      .json()
      .then(parseApiKeyBody)
      // check if the api key already exists
      .then(async (apiKey) => {
        await readApiKey(apiKey);
        return apiKey;
      })
      .then(async (apiKey) => {
        const primaryKey = await createAPIMSubscription(
          apiKey.resourceId,
          apiKey.displayName
        );
        return { ...apiKey, primaryKey };
      })
      .then(newApiKey)
      // for the moment, primary key will be saved on database
      .then(insertApiKey)
      .then(({ id, primaryKey }) =>
        NextResponse.json({ id, primaryKey }, { status: 201 })
      )
      .catch(getResponseFromError)
  );
}
