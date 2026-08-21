import { EventHubProducerClient } from "@azure/event-hubs";
import { ServiceUnavailableError } from "@pagopa/hexagonal-core/domain/errors";
import { err, ok } from "neverthrow";
import type { SignEventsHub } from "../../../application/ports/sign-events-hub.js";

export const makeSignEventsHub = (
  client: EventHubProducerClient
): SignEventsHub => ({
  checkHealth: async () => {
    try {
      await client.getPartitionIds();
      return ok(undefined);
    } catch {
      return err(new ServiceUnavailableError(`sign-events hub unreachable.`));
    }
  }
});
