import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";

import {
  HealthCheck,
  toHealthProblems,
} from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";
import { EventHubProducerClient } from "@azure/event-hubs";

export type AzureEventHubProblemSource = "AzureEventHub";

export const makeAzureEventHubHealthCheck = (
  client: EventHubProducerClient
): HealthCheck<AzureEventHubProblemSource> =>
  pipe(
    TE.tryCatch(
      () => client.getPartitionIds(),
      toHealthProblems("AzureEventHub")
    ),
    TE.map(() => true)
  );
