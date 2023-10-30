import { app } from "@azure/functions";
import { getConfigFromEnvironment } from "./config";
import { healthHandler } from "@/infra/handlers/health";
import { onSelfcareContractsMessageHandler } from "@/infra/handlers/on-selfcare-contracts-message";
import { SelfcareInstitutionRepository } from "@/infra/selfcare/institution";
import { BackOfficeIssuerRepository } from "@/infra/back-office/issuer";
import { SlackMessageRepository } from "@/infra/slack/message";
import { ioSignContracts } from "@/infra/selfcare/contract";
import { azureFunction } from "@/infra/handlers/handler-kit/handler-kit-azure-func";

const config = getConfigFromEnvironment();

const issuerRepository = new BackOfficeIssuerRepository(
  config.backOffice.apiBasePath,
  config.backOffice.apiKey
);

const institutionRepository = new SelfcareInstitutionRepository(
  config.selfcare.api.basePath,
  config.selfcare.api.key
);

const slackRepository = new SlackMessageRepository(config.slack.webhookUrl);

app.http("health", {
  methods: ["GET"],
  handler: healthHandler,
});

app.eventHub("onSelfcareContractsMessage", {
  connection: "SelfcareEventHubConnectionString",
  eventHubName: config.selfcare.eventHub.contractsName,
  cardinality: "many",
  handler: azureFunction(onSelfcareContractsMessageHandler)({
    issuerRepository,
    slackRepository,
    institutionRepository,
    schema: ioSignContracts,
  }),
});
