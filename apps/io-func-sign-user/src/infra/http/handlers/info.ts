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
  makePdvTokenizerHealthCheck,
  TokenizerProblemSource
} from "@io-sign/io-sign/infra/pdv-tokenizer/health-check";
import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { IOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import {
  IOServicesProblemSource,
  makeIOServicesHealthCheck
} from "@io-sign/io-sign/infra/io-services/health-check";
import { NamirialConfig } from "../../namirial/config";

import {
  makeNamirialHealthCheck,
  NamirialProblemSource
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
import { LollipopApiClientExt } from "../../lollipop/client";
import type { LollipopApiClientInt } from "../../lollipop/lc-params";
import {
  LollipopApiClientExtProblemSource,
  LollipopApiClientIntProblemSource,
  makeLollipopExtClientHealthCheck,
  makeLollipopIntClientHealthCheck
} from "../../lollipop/health-check";

declare const APP_VERSION: string;

type ProblemSource =
  | AzureCosmosProblemSource
  | AzureStorageProblemSource
  | TokenizerProblemSource
  | IOServicesProblemSource
  | NamirialProblemSource
  | LollipopApiClientExtProblemSource
  | LollipopApiClientIntProblemSource;

const applicativeValidation = TE.getApplicativeTaskValidation(
  Task.ApplicativePar,
  RA.getSemigroup<HealthProblem<ProblemSource>>()
);

type InfoDependencies = {
  namirialConfig: NamirialConfig;
  pdvTokenizerClient: PdvTokenizerClientWithApiKey;
  ioApiClient: IOApiClient;
  lollipopApiClientExt: LollipopApiClientExt;
  lollipopApiClientInt: LollipopApiClientInt;
  db: Database;
  filledContainerClient: ContainerClient;
  validatedContainerClient: ContainerClient;
  signedContainerClient: ContainerClient;
  documentsToFillQueue: QueueClient;
  qtspQueue: QueueClient;
  onWaitForSignatureQueueClient: QueueClient;
};

export const InfoHandler = H.of((_req: H.HttpRequest) =>
  pipe(
    RTE.ask<InfoDependencies>(),
    RTE.chainTaskEitherK(
      ({
        namirialConfig,
        pdvTokenizerClient,
        ioApiClient,
        lollipopApiClientExt,
        lollipopApiClientInt,
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
            makeLollipopExtClientHealthCheck(lollipopApiClientExt)(),
            makeLollipopIntClientHealthCheck(lollipopApiClientInt)(),
            makeNamirialHealthCheck(namirialConfig.prod),
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
