import * as RTE from "fp-ts/ReaderTaskEither";
import * as Task from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import * as RA from "fp-ts/ReadonlyArray";
import { pipe } from "fp-ts/function";

import * as H from "@pagopa/handler-kit";

import { Database } from "@azure/cosmos";
import { HealthProblem } from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";
import { ContainerClient } from "@azure/storage-blob";
import { QueueClient } from "@azure/storage-queue";
import {
  EventHubConsumerClient,
  EventHubProducerClient
} from "@azure/event-hubs";

import {
  makePdvTokenizerHealthCheck,
  TokenizerProblemSource
} from "@io-sign/io-sign/infra/pdv-tokenizer/health-check";
import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { IOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import {
  IOServicesProblemSource,
  makeIOServicesHealthCheck
} from "@io-sign/io-sign/infra/io-services/health-check";
import {
  AzureEventHubProblemSource,
  makeAzureEventHubHealthCheck
} from "@io-sign/io-sign/infra/azure/event-hubs/health-check";

import {
  AzureCosmosProblemSource,
  makeAzureCosmosDbHealthCheck
} from "../../azure/cosmos/health-check";
import {
  AzureStorageProblemSource,
  makeAzureStorageContainerHealthCheck,
  makeAzureStorageQueueHealthCheck
} from "../../azure/storage/health-check";

declare const APP_VERSION: string;

type ProblemSource =
  | AzureCosmosProblemSource
  | AzureStorageProblemSource
  | AzureEventHubProblemSource
  | TokenizerProblemSource
  | IOServicesProblemSource;

const applicativeValidation = TE.getApplicativeTaskValidation(
  Task.ApplicativePar,
  RA.getSemigroup<HealthProblem<ProblemSource>>()
);

type InfoDependencies = {
  pdvTokenizerClient: PdvTokenizerClientWithApiKey;
  ioApiClient: IOApiClient;
  db: Database;
  eventHubBillingClient: EventHubProducerClient;
  eventHubAnalyticsClient: EventHubProducerClient;
  eventHubSelfCareContractsConsumer: EventHubConsumerClient;
  uploadedContainerClient: ContainerClient;
  validatedContainerClient: ContainerClient;
  onSignatureRequestReadyQueueClient: QueueClient;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const InfoHandler = H.of((_req: H.HttpRequest) =>
  pipe(
    RTE.ask<InfoDependencies>(),
    RTE.chainTaskEitherK(
      ({
        pdvTokenizerClient,
        ioApiClient,
        db,
        eventHubBillingClient,
        eventHubAnalyticsClient,
        eventHubSelfCareContractsConsumer,
        uploadedContainerClient,
        validatedContainerClient,
        onSignatureRequestReadyQueueClient
      }) =>
        pipe(
          [
            makePdvTokenizerHealthCheck(pdvTokenizerClient)(),
            makeIOServicesHealthCheck(ioApiClient)(),
            makeAzureCosmosDbHealthCheck(db),
            makeAzureEventHubHealthCheck(eventHubBillingClient),
            makeAzureEventHubHealthCheck(eventHubAnalyticsClient),
            makeAzureEventHubHealthCheck(eventHubSelfCareContractsConsumer),
            makeAzureStorageContainerHealthCheck(uploadedContainerClient),
            makeAzureStorageContainerHealthCheck(validatedContainerClient),
            makeAzureStorageQueueHealthCheck(onSignatureRequestReadyQueueClient)
          ],
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
