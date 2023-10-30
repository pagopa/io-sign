import { app } from "@azure/functions";
import { healthHandler } from "@/infra/handlers/health";
import { pipe, identity } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import { onSelfcareContractsMessageHandler } from "@/infra/handlers/on-selfcare-contracts-message";
import { SelfcareInstitutionRepository } from "@/infra/selfcare/institution";
import { BackOfficeIssuerRepository } from "@/infra/back-office/issuer";
import { SlackChannelRepository } from "@/infra/slack/channel";
import { ioSignContracts } from "@/infra/selfcare/contract";
import { azureFunction } from "@/infra/handlers/handler-kit/handler-kit-azure-func";
import { getConfigFromEnvironment } from "./config";

const configOrError = pipe(
  getConfigFromEnvironment(process.env),
  E.getOrElseW(identity)
);

if (configOrError instanceof Error) {
  throw configOrError;
}

const config = configOrError;

const issuerRepository = new BackOfficeIssuerRepository(
  config.backOffice.apiBasePath,
  config.backOffice.apiKey
);

const institutionRepository = new SelfcareInstitutionRepository(
  config.selfcare.api.basePath,
  config.selfcare.api.key
);

const slackRepository = new SlackChannelRepository(config.slack.webhookUrl);

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
    institutionRepository,
    schema: ioSignContracts,
  }),
});
