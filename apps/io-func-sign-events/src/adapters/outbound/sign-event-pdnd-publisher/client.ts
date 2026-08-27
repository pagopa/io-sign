import { EventHubProducerClient } from "@azure/event-hubs";
import {
  GenericError,
  ServiceUnavailableError
} from "@pagopa/hexagonal-core/domain/errors";
import { err, ok } from "neverthrow";
import type {
  AnalyticsEvent,
  BillingEvent
} from "../../../domain/pdnd-event.js";
import type { SignEventPDNDPublisher } from "../../../domain/ports/outbound/sign-event-pdnd-publisher.js";
import type { SignEventPDNDPublisherConfig } from "./config.js";

const sendEvent = async (
  client: EventHubProducerClient,
  body: AnalyticsEvent | BillingEvent
): Promise<void> => {
  const batch = await client.createBatch();
  batch.tryAdd({ body });
  await client.sendBatch(batch);
};

export const makeSignEventPDNDPublisher = (
  { connectionString }: SignEventPDNDPublisherConfig,
  eventHubNameBilling: string,
  eventHubNameAnalytics: string
): SignEventPDNDPublisher => {
  const clientBilling = new EventHubProducerClient(
    connectionString,
    eventHubNameBilling
  );
  const clientAnalytics = new EventHubProducerClient(
    connectionString,
    eventHubNameAnalytics
  );
  return {
    checkHealth: async () => {
      try {
        await clientBilling.getPartitionIds();
        await clientAnalytics.getPartitionIds();
        return ok(undefined);
      } catch {
        return err(
          new ServiceUnavailableError(`sign-event pdnd publisher unreachable.`)
        );
      }
    },
    sendAnalyticsEvent: async (event) => {
      try {
        await sendEvent(clientAnalytics, event);
        return ok(undefined);
      } catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        return err(
          new GenericError(`failed to send analytics event: ${detail}`)
        );
      }
    },
    sendBillingEvent: async (event) => {
      try {
        await sendEvent(clientBilling, event);
        return ok(undefined);
      } catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        return err(new GenericError(`failed to send billing event: ${detail}`));
      }
    }
  };
};
