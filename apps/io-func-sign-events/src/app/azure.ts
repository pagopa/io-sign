import { EventHubProducerClient } from "@azure/event-hubs";
import {
  getApplicationInsightsConfigFromEnvironment,
  makeAzureTelemetryClient
} from "@io-sign/hexagonal-azure-functions";
import { makeApplicationInsightsLogger } from "@pagopa/hexagonal-core/adapters/logger";
import { getSignEventsHubConfigFromEnvironment } from "../infra/azure/event-hubs/config.js";
import { makeSignEventsHub } from "../infra/azure/event-hubs/sign-events.health.js";
import { getBackofficeFuncConfigFromEnvironment } from "../infra/backoffice-func/config.js";
import { makeBackofficeFunc } from "../infra/backoffice-func/client.js";
import { mountInfoAdapter } from "../adapters/inbound/index.js";
import { makeInfoUseCase } from "../application/use-cases/info.use-case.js";

// future EventHub example:
// import { mountSignEventTrigger } from "../adapters/inbound/azure/event-hub.adapter.js";
// import { makeProcessSignEventUseCase } from "../application/use-cases/process-sign-event.use-case.js";

const ERROR_RESPONDER_CONFIG = {
  typeBaseUrl: "https://example.pagopa.it/problems/"
};

const aiConfig = getApplicationInsightsConfigFromEnvironment();
const logger = makeApplicationInsightsLogger({
  client: makeAzureTelemetryClient(aiConfig),
  baseProperties: { service: "io-func-sign-events" }
});

const signEventsHubConfig = getSignEventsHubConfigFromEnvironment();
const signEventsHubClient = new EventHubProducerClient(
  signEventsHubConfig.connectionString
);
const signEventsHub = makeSignEventsHub(signEventsHubClient);
const backofficeFunc = makeBackofficeFunc(
  getBackofficeFuncConfigFromEnvironment()
);

// Endpoints.
mountInfoAdapter(
  makeInfoUseCase({ logger, signEventsHub, backofficeFunc }),
  ERROR_RESPONDER_CONFIG
);

// mountSignEventTrigger(makeProcessSignEventUseCase({ logger, signEventsHub }));
