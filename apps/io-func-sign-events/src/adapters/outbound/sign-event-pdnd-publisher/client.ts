import { EventHubProducerClient } from "@azure/event-hubs";
import { ServiceUnavailableError } from "@pagopa/hexagonal-core/domain/errors";
import { err, ok } from "neverthrow";
import type { SignEventPDNDPublisher } from "../../../domain/ports/outbound/sign-event-pdnd-publisher.js";
import type { SignEventPDNDPublisherConfig } from "./config.js";

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
          new ServiceUnavailableError(`sign-event publisher unreachable.`)
        );
      }
    }
  };
};
