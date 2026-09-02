// import { makeSignEventWebhookUseCase } from "../application/use-cases/sign-event-webhook.use-case.js";
import { getSignEventPDNDPublisherConfigFromEnvironment } from "../adapters/outbound/sign-event-pdnd-publisher/config.js";
import { makeSignEventPDNDPublisher } from "../adapters/outbound/sign-event-pdnd-publisher/client.js";
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
import { makeSignEventWebhookUseCase } from "../application/use-cases/sign-event-webhook.use-case.js";
import { makeSignEventWebhookQueuePublisher } from "../adapters/outbound/sign-event-webhook-queue-publisher/client.js";
import { getSignEventWebhookQueuePublisherConfigFromEnvironment } from "../adapters/outbound/sign-event-webhook-queue-publisher/config.js";

const ERROR_RESPONDER_CONFIG = {
  typeBaseUrl: "https://example.pagopa.it/problems/"
};

const SIGN_EVENT_HUB_NAME = "io-p-itn-sign-events-01";
const PDND_BILLING_EVENT_HUB_NAME = "io-p-itn-sign-billing-01";
const PDND_ANALYTICS_EVENT_HUB_NAME = "io-p-itn-sign-analytics-01";
const WEBHOOK_QUEUE_NAME = "webhook-delivery";

// TODO: evaluate switch to makeApplicationInsightsLogger from @pagopa/hexagonal-core/adapters.

makeAzureTelemetryClient(getApplicationInsightsConfigFromEnvironment());

const pdndPublisher = makeSignEventPDNDPublisher(
  getSignEventPDNDPublisherConfigFromEnvironment(),
  PDND_BILLING_EVENT_HUB_NAME,
  PDND_ANALYTICS_EVENT_HUB_NAME
);
const webhookQueuePublisher = makeSignEventWebhookQueuePublisher(
  getSignEventWebhookQueuePublisherConfigFromEnvironment(),
  WEBHOOK_QUEUE_NAME
);
const backofficeService = makeBackofficeService(
  getBackofficeServiceConfigFromEnvironment()
);

// Endpoints.
mountInfoAdapterHttp(
  (logger) =>
    makeInfoUseCase({
      logger,
      pdndPublisher,
      backofficeService,
      webhookQueuePublisher
    }),
  ERROR_RESPONDER_CONFIG
);

// Event Hub triggers.
mountSignEventAdapterTrigger(
  (logger) => makeSignEventPDNDUseCase({ logger, pdndPublisher }),
  {
    connection: "SignEventsHubItnConnectionString",
    eventHubName: SIGN_EVENT_HUB_NAME,
    consumerGroup: "pdnd"
  }
);

mountSignEventAdapterTrigger(
  (logger) =>
    makeSignEventWebhookUseCase({
      logger,
      backofficeService,
      webhookQueuePublisher
    }),
  {
    connection: "SignEventsHubItnConnectionString",
    eventHubName: SIGN_EVENT_HUB_NAME,
    consumerGroup: "webhook"
  }
);
