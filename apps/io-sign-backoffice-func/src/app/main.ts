import { app } from "@azure/functions";
import { azureFunction } from "@pagopa/handler-kit-azure-func";

import { google } from "googleapis";

import { getConfigFromEnvironment } from "./config";
import { healthHandler } from "@/infra/handlers/health";
import { onSelfcareContractsMessageHandler } from "@/infra/handlers/on-selfcare-contracts-message";
import { ioSignContracts } from "@/infra/selfcare/contract";
import { IoTsType } from "@/infra/handlers/validation";
import { BackofficeApiClient } from "@/infra/back-office/client";

const config = getConfigFromEnvironment();

const googleAuth = new google.auth.GoogleAuth({
  credentials: config.google.credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

app.http("health", {
  methods: ["GET"],
  handler: healthHandler,
});

const onSelfcareContractsMessage = azureFunction(
  onSelfcareContractsMessageHandler
)({
  inputDecoder: IoTsType(ioSignContracts),
  slackWebhook: config.slack.webhookUrl,
  backofficeApiClient: new BackofficeApiClient(
    config.backOffice.apiBasePath,
    config.backOffice.apiKey
  ),
  google: {
    auth: googleAuth,
    spreadsheetId: config.google.spreadsheetId,
  },
});

app.eventHub("onSelfcareContractsMessage", {
  connection: "SelfCareEventHubConnectionString",
  eventHubName: config.selfcare.eventHubContractsName,
  cardinality: "many",
  handler: onSelfcareContractsMessage,
});
