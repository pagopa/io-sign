import { EventHubProducerClient } from "@azure/event-hubs";
import { ServiceUnavailableError } from "@pagopa/hexagonal-core/domain/errors";
import { err, ok } from "neverthrow";
import type { SignEventPublisher } from "../../../domain/ports/outbound/sign-event-publisher.js";
import type { SignEventPublisherConfig } from "./config.js";

export const makeSignEventPublisher = (
  { connectionString }: SignEventPublisherConfig,
  eventHubName: string
): SignEventPublisher => {
  const client = new EventHubProducerClient(connectionString, eventHubName);
  return {
    checkHealth: async () => {
      try {
        await client.getPartitionIds();
        return ok(undefined);
      } catch {
        return err(
          new ServiceUnavailableError(`sign-event publisher unreachable.`)
        );
      }
    }
  };
};
