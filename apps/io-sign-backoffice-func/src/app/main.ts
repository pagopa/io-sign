import { app } from "@azure/functions";
import { azureFunction } from "@pagopa/handler-kit-azure-func";
import { getConfigFromEnvironment } from "./config";
import { healthHandler } from "@/infra/handlers/health";
import { onSelfcareContractsMessageHandler } from "@/infra/handlers/on-selfcare-contracts-message";
import { ioSignContracts } from "@/infra/selfcare/contract";
import { IoTsType } from "@/infra/handlers/validation";
import { getById } from "@/infra/back-office/issuer";
import { sendMessage } from "@/infra/slack/message";

const { backOffice, slack, selfcare } = getConfigFromEnvironment();

app.http("health", {
  methods: ["GET"],
  handler: healthHandler,
});

app.eventHub("onSelfcareContractsMessage", {
  connection: "SelfCareEventHubConnectionString",
  eventHubName: selfcare.eventHubContractsName,
  cardinality: "many",
  handler: azureFunction(onSelfcareContractsMessageHandler)({
    inputDecoder: IoTsType(ioSignContracts),
    getById: getById(backOffice.apiBasePath, backOffice.apiKey),
    sendMessage: sendMessage(slack.webhookUrl),
  }),
});
