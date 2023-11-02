import { app } from "@azure/functions";
import { getConfigFromEnvironment } from "./config";
import { healthHandler } from "@/infra/handlers/health";
import { onSelfcareContractsMessageHandler } from "@/infra/handlers/on-selfcare-contracts-message";
import { BackOfficeIssuerRepository } from "@/infra/back-office/issuer";
import { SlackMessageRepository } from "@/infra/slack/message";
import { ioSignContracts } from "@/infra/selfcare/contract";
import { azureFunction } from "@/infra/handlers/handler-kit/handler-kit-azure-func";
import { IoTsType } from "@/infra/handlers/validation";

const config = getConfigFromEnvironment();

const issuerRepository = new BackOfficeIssuerRepository(
  config.backOffice.apiBasePath,
  config.backOffice.apiKey
);

const slackRepository = new SlackMessageRepository(config.slack.webhookUrl);

app.http("health", {
  methods: ["GET"],
  handler: healthHandler,
});

app.eventHub("onSelfcareContractsMessage", {
  connection: "SelfCareEventHubConnectionString",
  eventHubName: config.selfcare.eventHub.contractsName,
  cardinality: "many",
  handler: azureFunction(onSelfcareContractsMessageHandler)({
    issuerRepository,
    slackRepository,
    inputDecoder: IoTsType(ioSignContracts),
  }),
});
