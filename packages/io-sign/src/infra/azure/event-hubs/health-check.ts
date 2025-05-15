import {
  EventHubConsumerClient,
  EventHubProducerClient
} from "@azure/event-hubs";
import {
  HealthCheck,
  toHealthProblems
} from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

export type AzureEventHubProblemSource = "AzureEventHub";

export const makeAzureEventHubHealthCheck = (
  client: EventHubProducerClient | EventHubConsumerClient
): HealthCheck<AzureEventHubProblemSource> =>
  pipe(
    TE.tryCatch(
      () => client.getPartitionIds(),
      toHealthProblems("AzureEventHub")
    ),
    TE.map(() => true)
  );
