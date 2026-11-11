import { app } from "@azure/functions";
import * as L from "@pagopa/logger";
import { ConsoleLogger } from "@io-sign/io-sign/infra/console-logger";
import {
  azureFunction,
  httpAzureFunction
} from "@pagopa/handler-kit-azure-func";
import { EventHubConsumerClient } from "@azure/event-hubs";
import { makeCreateApiKeyByIdHandler } from "@/infra/handlers/create-api-key-by-id";

import { google } from "googleapis";

import { CosmosClient } from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";
import { getConfigFromEnvironment } from "./config";
import { infoHandler } from "@/infra/handlers/info";
import { onSelfcareContractsMessageHandler } from "@/infra/handlers/on-selfcare-contracts-message";
import { getApiKeyHandler } from "@/infra/handlers/get-api-key";
import { getWebhookHandler } from "@/infra/handlers/get-webhook";
import { ioSignContracts } from "@/infra/selfcare/contract";
import { IoTsType } from "@/infra/handlers/validation";
import { BackofficeEntitiesRepository } from "@/infra/azure/cosmos";
import { SelfcareApiClient } from "@/infra/selfcare/api-client";
import { initAppInsights } from "@pagopa/ts-commons/lib/appinsights";
import { getApiKeyAccessControlHandler } from "@/infra/handlers/get-api-key-access-control";

const config = getConfigFromEnvironment();

const googleAuth = new google.auth.GoogleAuth({
  credentials: config.google.credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const getCosmosClient = () => {
  if (process.env.NODE_ENV !== "production") {
    L.info("Returning a connection-string CosmosClient")({
      logger: ConsoleLogger
    })();
    return new CosmosClient(config.cosmos.cosmosDbConnectionString);
  }
  if (!config.cosmos.cosmosDbEndpoint) {
    throw new Error("COSMOS_DB__accountEndpoint must be set in production");
  }
  L.info("Returning an RBAC CosmosClient")({ logger: ConsoleLogger })();
  return new CosmosClient({
    endpoint: config.cosmos.cosmosDbEndpoint,
    aadCredentials: new DefaultAzureCredential()
  });
};

const cosmos = getCosmosClient();
const database = cosmos.database(config.cosmos.cosmosDbName);

const backofficeRepository = new BackofficeEntitiesRepository(database);

initAppInsights(config.appinsights.applicationInsightsConnectionString, {
  samplingPercentage: config.appinsights.applicationInsightsSamplingPercentage
});

const selfcareApiClient = new SelfcareApiClient(config.selfcare.api);

const selfcareContractsConsumer = new EventHubConsumerClient(
  EventHubConsumerClient.defaultConsumerGroupName,
  config.selfcare.contracts.connectionString,
  config.selfcare.contracts.eventHubContractsName
);

const onSelfcareContractsMessage = azureFunction(
  onSelfcareContractsMessageHandler
)({
  inputDecoder: IoTsType(ioSignContracts),
  slackWebhook: config.slack.webhookUrl,
  issuerRepository: backofficeRepository,
  userRepository: selfcareApiClient,
  google: {
    auth: googleAuth,
    spreadsheetId: config.google.spreadsheetId
  }
});

app.eventHub("onSelfcareContractsMessage", {
  connection: "SelfCareEventHubConnectionString",
  eventHubName: config.selfcare.contracts.eventHubContractsName,
  cardinality: "many",
  handler: onSelfcareContractsMessage
});

const getApiKey = httpAzureFunction(getApiKeyHandler)({
  institutionRepository: selfcareApiClient,
  issuerRepository: backofficeRepository,
  apiKeyRepository: backofficeRepository
});

app.http("getApiKey", {
  methods: ["GET"],
  authLevel: "function",
  route: "api-keys/{id}",
  handler: getApiKey
});

const getWebhook = httpAzureFunction(getWebhookHandler)({
  webhookRepository: backofficeRepository
});

app.http("getWebhook", {
  methods: ["GET"],
  authLevel: "function",
  route: "institutions/{institutionId}/issuers/{issuerId}/webhook",
  handler: getWebhook
});

const { apiKeysByIdOutput, handler: createApiKeyById } =
  makeCreateApiKeyByIdHandler(config.cosmos.cosmosDbName);

app.cosmosDB("createApiKeyById", {
  containerName: "api-keys",
  databaseName: config.cosmos.cosmosDbName,
  connection: "COSMOS_DB",
  createLeaseContainerIfNotExists: process.env.NODE_ENV !== "production",
  leaseContainerName: "leases",
  leaseContainerPrefix: "api-keys",
  startFromBeginning: true,
  extraOutputs: [apiKeysByIdOutput],
  handler: createApiKeyById
});

const info = httpAzureFunction(infoHandler)({ selfcareContractsConsumer });

app.http("info", {
  methods: ["GET"],
  handler: info
});

const getApiKeyAccessControl = httpAzureFunction(getApiKeyAccessControlHandler)(
  {
    apiKeyRepository: backofficeRepository
  }
);

app.http("getApiKeyAccessControl", {
  methods: ["GET"],
  authLevel: "function",
  route: "api-keys/{id}/access-control",
  handler: getApiKeyAccessControl
});
