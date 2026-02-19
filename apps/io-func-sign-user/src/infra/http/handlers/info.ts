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
  TokenizerProblemSource,
  makePdvTokenizerHealthCheck
} from "@io-sign/io-sign/infra/pdv-tokenizer/health-check";
import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { IOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import {
  IOServicesProblemSource,
  makeIOServicesHealthCheck
} from "@io-sign/io-sign/infra/io-services/health-check";
import { NamirialConfig } from "../../namirial/config";

import {
  NamirialProblemSource,
  makeNamirialHealthCheck
} from "../../namirial/health-check";
import {
  AzureCosmosProblemSource,
  makeAzureCosmosDbHealthCheck
} from "../../azure/cosmos/health-check";
import {
  AzureStorageProblemSource,
  makeAzureStorageContainerHealthCheck,
  makeAzureStorageQueueHealthCheck
} from "../../azure/storage/health-check";
import { LollipopApiClient } from "../../lollipop/client";
import {
  LollipopApiClientProblemSource,
  makeLollipopClientHealthCheck
} from "../../lollipop/health-check";

type ProblemSource =
  | AzureCosmosProblemSource
  | AzureStorageProblemSource
  | TokenizerProblemSource
  | IOServicesProblemSource
  | NamirialProblemSource
  | LollipopApiClientProblemSource;

const applicativeValidation = TE.getApplicativeTaskValidation(
  Task.ApplicativePar,
  RA.getSemigroup<HealthProblem<ProblemSource>>()
);

type InfoDependencies = {
  namirialConfig: NamirialConfig;
  pdvTokenizerClient: PdvTokenizerClientWithApiKey;
  ioApiClient: IOApiClient;
  lollipopApiClient: LollipopApiClient;
  db: Database;
  filledContainerClient: ContainerClient;
  validatedContainerClient: ContainerClient;
  signedContainerClient: ContainerClient;
  documentsToFillQueue: QueueClient;
  qtspQueue: QueueClient;
  onWaitForSignatureQueueClient: QueueClient;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const InfoHandler = H.of((_req: H.HttpRequest) =>
  pipe(
    RTE.ask<InfoDependencies>(),
    RTE.chainTaskEitherK(
      ({
        namirialConfig,
        pdvTokenizerClient,
        ioApiClient,
        lollipopApiClient,
        db,
        filledContainerClient,
        validatedContainerClient,
        signedContainerClient,
        documentsToFillQueue,
        qtspQueue,
        onWaitForSignatureQueueClient
      }) =>
        pipe(
          [
            makeLollipopClientHealthCheck(lollipopApiClient)(),
            makeNamirialHealthCheck(namirialConfig.prod),
            makeNamirialHealthCheck(namirialConfig.test),
            makePdvTokenizerHealthCheck(pdvTokenizerClient)(),
            makeIOServicesHealthCheck(ioApiClient)(),
            makeAzureCosmosDbHealthCheck(db),
            makeAzureStorageContainerHealthCheck(filledContainerClient),
            makeAzureStorageContainerHealthCheck(validatedContainerClient),
            makeAzureStorageContainerHealthCheck(signedContainerClient),
            makeAzureStorageQueueHealthCheck(documentsToFillQueue),
            makeAzureStorageQueueHealthCheck(qtspQueue),
            makeAzureStorageQueueHealthCheck(onWaitForSignatureQueueClient)
          ],
          RA.sequence(applicativeValidation),
          TE.map(() => ({ message: "It's working!" }))
        )
    ),
    RTE.map(H.successJson),
    RTE.orElseW((error) =>
      RTE.of(
        H.problemJson({
          status: 503,
          title: "Service Unavailable",
          detail: error instanceof Error ? error.message : String(error)
        })
      )
    )
  )
);
