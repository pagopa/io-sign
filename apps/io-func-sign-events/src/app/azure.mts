import { EventHubProducerClient } from "@azure/event-hubs";
import { makeSignEventWebhookUseCase } from "../application/use-cases/sign-event-webhook.use-case.js";
import { getSignEventsHubConfigFromEnvironment } from "../infra/azure/event-hubs/config.js";
import { makeSignEventsHub } from "../infra/azure/event-hubs/sign-events.health.js";
import { getBackofficeFuncConfigFromEnvironment } from "../infra/backoffice-func/config.js";
import { makeBackofficeFunc } from "../infra/backoffice-func/client.mjs";
import {
  mountInfoAdapterHttp,
  mountSignEventAdapterTrigger
} from "../adapters/inbound/index.js";
import { makeInfoUseCase } from "../application/use-cases/info.use-case.js";
import { makeSignEventPDNDUseCase } from "../application/use-cases/sign-event-pdnd.use-case.js";
import {
  getApplicationInsightsConfigFromEnvironment,
  makeAzureTelemetryClient
} from "@io-sign/hexagonal-azure-functions";

const ERROR_RESPONDER_CONFIG = {
  typeBaseUrl: "https://example.pagopa.it/problems/"
};

// TODO: evaluate switch to makeApplicationInsightsLogger from @pagopa/hexagonal-core/adapters.

makeAzureTelemetryClient(getApplicationInsightsConfigFromEnvironment());

const signEventsHubConfig = getSignEventsHubConfigFromEnvironment();
const signEventsHubClient = new EventHubProducerClient(
  signEventsHubConfig.connectionString,
  "io-p-itn-sign-events-01"
);
const signEventsHub = makeSignEventsHub(signEventsHubClient);
const backofficeFunc = makeBackofficeFunc(
  getBackofficeFuncConfigFromEnvironment()
);

// Endpoints.
mountInfoAdapterHttp(
  (logger) => makeInfoUseCase({ logger, signEventsHub, backofficeFunc }),
  ERROR_RESPONDER_CONFIG
);

// Event Hub triggers.
mountSignEventAdapterTrigger((logger) => makeSignEventPDNDUseCase({ logger }), {
  connection: "SignEventsHubItnConnectionString",
  eventHubName: "io-p-itn-sign-events-01",
  consumerGroup: "pdnd"
});

mountSignEventAdapterTrigger(
  (logger) => makeSignEventWebhookUseCase({ logger }),
  {
    connection: "SignEventsHubItnConnectionString",
    eventHubName: "io-p-itn-sign-events-01",
    consumerGroup: "webhook"
  }
);
