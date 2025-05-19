import { flow, pipe } from "fp-ts/lib/function";
import * as Task from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as t from "io-ts";

import * as azure from "handler-kit-legacy/lib/azure";
import { createHandler, nopRequestDecoder } from "handler-kit-legacy";

import { error, success } from "@io-sign/io-sign/infra/http/response";
import { HttpError } from "@io-sign/io-sign/infra/http/errors";

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
} from "../cosmos/health-check";
import {
  AzureStorageProblemSource,
  makeAzureStorageContainerHealthCheck,
  makeAzureStorageQueueHealthCheck
} from "../storage/health-check";
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

const InfoDetailView = t.string;
const applicativeValidation = TE.getApplicativeTaskValidation(
  Task.ApplicativePar,
  RA.getSemigroup<HealthProblem<ProblemSource>>()
);

export const makeInfoHandler = (
  namirialConfig: NamirialConfig,
  pdvTokenizerClient: PdvTokenizerClientWithApiKey,
  ioApiClient: IOApiClient,
  lollipopApiClient: LollipopApiClient,
  db: Database,
  filledContainerClient: ContainerClient,
  validatedContainerClient: ContainerClient,
  signedContainerClient: ContainerClient,
  documentsToFillQueue: QueueClient,
  qtspQueue: QueueClient,
  onWaitForSignatureQueueClient: QueueClient
) =>
  createHandler(
    nopRequestDecoder,
    () =>
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
        TE.map(() => "It's working!"),
        TE.mapLeft((problems) => new HttpError(problems.join("\n\n")))
      ),
    error,
    success(InfoDetailView)
  );

export const makeInfoFunction = flow(makeInfoHandler, azure.unsafeRun);
