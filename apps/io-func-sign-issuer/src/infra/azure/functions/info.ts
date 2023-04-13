import { flow, pipe } from "fp-ts/lib/function";
import * as Task from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as t from "io-ts";

import * as azure from "@pagopa/handler-kit/lib/azure";
import { createHandler, nopRequestDecoder } from "@pagopa/handler-kit";

import { error, success } from "@io-sign/io-sign/infra/http/response";
import { HttpError } from "@io-sign/io-sign/infra/http/errors";

import { Database } from "@azure/cosmos";
import { HealthProblem } from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";
import { ContainerClient } from "@azure/storage-blob";
import { QueueClient } from "@azure/storage-queue";
import {
  makePdvTokenizerHealthCheck,
  TokenizerProblemSource,
} from "@io-sign/io-sign/infra/pdv-tokenizer/health-check";
import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { IOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import {
  IOServicesProblemSource,
  makeIOServicesHealthCheck,
} from "@io-sign/io-sign/infra/io-services/health-check";

import {
  EventHubConsumerClient,
  EventHubProducerClient,
} from "@azure/event-hubs";
import {
  AzureEventHubProblemSource,
  makeAzureEventHubHealthCheck,
} from "@io-sign/io-sign/infra/azure/event-hubs/health-check";
import {
  AzureCosmosProblemSource,
  makeAzureCosmosDbHealthCheck,
} from "../cosmos/health-check";
import {
  AzureStorageProblemSource,
  makeAzureStorageContainerHealthCheck,
  makeAzureStorageQueueHealthCheck,
} from "../storage/health-check";

type ProblemSource =
  | AzureCosmosProblemSource
  | AzureStorageProblemSource
  | AzureEventHubProblemSource
  | TokenizerProblemSource
  | IOServicesProblemSource;

const InfoDetailView = t.string;
const applicativeValidation = TE.getApplicativeTaskValidation(
  Task.ApplicativePar,
  RA.getSemigroup<HealthProblem<ProblemSource>>()
);

export const makeInfoHandler = (
  pdvTokenizerClient: PdvTokenizerClientWithApiKey,
  ioApiClient: IOApiClient,
  db: Database,
  eventHubBillingClient: EventHubProducerClient,
  eventHubAnalyticsClient: EventHubProducerClient,
  eventHubSelfCareContractsConsumer: EventHubConsumerClient,
  uploadedContainerClient: ContainerClient,
  validatedContainerClient: ContainerClient,
  onSignatureRequestReadyQueueClient: QueueClient
) =>
  createHandler(
    nopRequestDecoder,
    () =>
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
          makeAzureStorageQueueHealthCheck(onSignatureRequestReadyQueueClient),
        ],
        RA.sequence(applicativeValidation),
        TE.map(() => "It's working!"),
        TE.mapLeft((problems) => new HttpError(problems.join("\n\n")))
      ),
    error,
    success(InfoDetailView)
  );

export const makeInfoFunction = flow(makeInfoHandler, azure.unsafeRun);
