import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as Task from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as RA from "fp-ts/lib/ReadonlyArray";
import { pipe } from "fp-ts/lib/function";

import * as H from "@pagopa/handler-kit";

import { EventHubConsumerClient } from "@azure/event-hubs";
import { HealthProblem } from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";
import {
  AzureEventHubProblemSource,
  makeAzureEventHubHealthCheck
} from "@io-sign/io-sign/infra/azure/event-hubs/health-check";

declare const APP_VERSION: string;

type ProblemSource = AzureEventHubProblemSource;

const applicativeValidation = TE.getApplicativeTaskValidation(
  Task.ApplicativePar,
  RA.getSemigroup<HealthProblem<ProblemSource>>()
);

type InfoDependencies = {
  selfcareContractsConsumer: EventHubConsumerClient;
};

export const infoHandler = H.of((_: H.HttpRequest) =>
  pipe(
    RTE.ask<InfoDependencies>(),
    RTE.chainTaskEitherK(({ selfcareContractsConsumer }) =>
      pipe(
        [makeAzureEventHubHealthCheck(selfcareContractsConsumer)],
        RA.sequence(applicativeValidation),
        TE.map(() => ({ message: "It's working!", version: APP_VERSION }))
      )
    ),
    RTE.map(H.successJson),
    RTE.orElseW((error) =>
      RTE.of(
        H.problemJson({
          status: 503,
          title: "Service Unavailable",
          detail: Array.isArray(error)
            ? error.join("\n\n")
            : error instanceof Error
              ? error.message
              : String(error)
        })
      )
    )
  )
);
