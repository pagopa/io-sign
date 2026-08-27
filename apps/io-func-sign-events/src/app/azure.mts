import { makeSignEventWebhookUseCase } from "../application/use-cases/sign-event-webhook.use-case.js";
import { getSignEventPublisherConfigFromEnvironment } from "../adapters/outbound/sign-event-publisher/config.js";
import { makeSignEventPublisher } from "../adapters/outbound/sign-event-publisher/client.js";
import { getBackofficeServiceConfigFromEnvironment } from "../adapters/outbound/backoffice-service/config.js";
import { makeBackofficeService } from "../adapters/outbound/backoffice-service/client.mjs";
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

const SIGN_EVENT_HUB_NAME = "io-p-itn-sign-events-01";

// TODO: evaluate switch to makeApplicationInsightsLogger from @pagopa/hexagonal-core/adapters.

makeAzureTelemetryClient(getApplicationInsightsConfigFromEnvironment());

const signEventPublisher = makeSignEventPublisher(
  getSignEventPublisherConfigFromEnvironment(),
  SIGN_EVENT_HUB_NAME
);
const backofficeService = makeBackofficeService(
  getBackofficeServiceConfigFromEnvironment()
);

// Endpoints.
mountInfoAdapterHttp(
  (logger) =>
    makeInfoUseCase({ logger, signEventPublisher, backofficeService }),
  ERROR_RESPONDER_CONFIG
);

// Event Hub triggers.
mountSignEventAdapterTrigger((logger) => makeSignEventPDNDUseCase({ logger }), {
  connection: "SignEventsHubItnConnectionString",
  eventHubName: SIGN_EVENT_HUB_NAME,
  consumerGroup: "pdnd"
});

mountSignEventAdapterTrigger(
  (logger) => makeSignEventWebhookUseCase({ logger }),
  {
    connection: "SignEventsHubItnConnectionString",
    eventHubName: SIGN_EVENT_HUB_NAME,
    consumerGroup: "webhook"
  }
);
