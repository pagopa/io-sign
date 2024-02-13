import { app, output } from "@azure/functions";
import {
  httpAzureFunction,
  azureFunction,
} from "@pagopa/handler-kit-azure-func";

import { google } from "googleapis";

import { CosmosClient } from "@azure/cosmos";
import { getConfigFromEnvironment } from "./config";
import { healthHandler } from "@/infra/handlers/health";
import { onSelfcareContractsMessageHandler } from "@/infra/handlers/on-selfcare-contracts-message";
import { getApiKeyHandler } from "@/infra/handlers/get-api-key";
import { ioSignContracts } from "@/infra/selfcare/contract";
import { IoTsType } from "@/infra/handlers/validation";
import { BackofficeEntitiesRepository } from "@/infra/azure/cosmos";
import { SelfcareApiClient } from "@/infra/selfcare/api-client";

import {
  createApiKeyByIdHandler,
  inputDecoder as createAPiKeyByIdInputDecoder,
} from "@/infra/handlers/create-api-key-by-id";

const config = getConfigFromEnvironment();

const googleAuth = new google.auth.GoogleAuth({
  credentials: config.google.credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const cosmos = new CosmosClient(config.cosmos.cosmosDbConnectionString);
const database = cosmos.database(config.cosmos.cosmosDbName);

const backofficeRepository = new BackofficeEntitiesRepository(database);

const selfcareApiClient = new SelfcareApiClient(config.selfcare.api);

const onSelfcareContractsMessage = azureFunction(
  onSelfcareContractsMessageHandler
)({
  inputDecoder: IoTsType(ioSignContracts),
  slackWebhook: config.slack.webhookUrl,
  issuerRepository: backofficeRepository,
  userRepository: selfcareApiClient,
  google: {
    auth: googleAuth,
    spreadsheetId: config.google.spreadsheetId,
  },
});

app.eventHub("onSelfcareContractsMessage", {
  connection: "SelfCareEventHubConnectionString",
  eventHubName: config.selfcare.contracts.eventHubContractsName,
  cardinality: "many",
  handler: onSelfcareContractsMessage,
});

const getApiKey = httpAzureFunction(getApiKeyHandler)({
  institutionRepository: selfcareApiClient,
  issuerRepository: backofficeRepository,
  apiKeyRepository: backofficeRepository,
});

app.http("getApiKey", {
  methods: ["GET"],
  authLevel: "function",
  route: "api-keys/{id}",
  handler: getApiKey,
});

const createApiKeyById = azureFunction(createApiKeyByIdHandler)({
  inputDecoder: createAPiKeyByIdInputDecoder,
});

app.cosmosDB("createApiKeyById", {
  collectionName: "api-keys",
  databaseName: config.cosmos.cosmosDbName,
  connectionStringSetting: "COSMOS_DB_CONNECTION_STRING",
  createLeaseCollectionIfNotExists: true,
  leaseCollectionName: "leases",
  leaseCollectionPrefix: "api-keys",
  return: output.cosmosDB({
    databaseName: config.cosmos.cosmosDbName,
    collectionName: "api-keys-by-id",
    createIfNotExists: false,
    connectionStringSetting: "COSMOS_DB_CONNECTION_STRING",
  }),
  handler: createApiKeyById,
});

app.http("health", {
  methods: ["GET"],
  handler: healthHandler,
});
