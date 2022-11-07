import { CosmosClient, Database as CosmosDatabase } from "@azure/cosmos";

import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { sequenceS } from "fp-ts/lib/Apply";
import { flow, identity, pipe } from "fp-ts/lib/function";

import { createHandler } from "@pagopa/handler-kit";
import { HttpRequest, error, created } from "@pagopa/handler-kit/lib/http";
import * as azure from "@pagopa/handler-kit/lib/azure";

import {
  CreateDossierPayload,
  makeCreateDossier,
} from "../../../app/use-cases/create-dossier";

import { DossierDetailView } from "../../http/models/DossierDetailView";

import { makeRequireIssuer } from "../../http/decoders/issuer";
import { requireDocumentsMetadata } from "../../http/decoders/document";

import { DossierToApiModel } from "../../http/encoders/dossier";

import { makeInsertDossier } from "../cosmos/dossier";
import { mockGetIssuerBySubscriptionId } from "../../__mocks__/issuer";
import { getConfigFromEnvironment } from "../../../app/config";

const makeCreateDossierHandler = (db: CosmosDatabase) => {
  const createDossierUseCase = pipe(db, makeInsertDossier, makeCreateDossier);

  const requireCreateDossierPayload: RTE.ReaderTaskEither<
    HttpRequest,
    Error,
    CreateDossierPayload
  > = sequenceS(RTE.ApplyPar)({
    issuer: makeRequireIssuer(mockGetIssuerBySubscriptionId),
    documentsMetadata: RTE.fromReaderEither(requireDocumentsMetadata),
  });

  const decodeHttpRequest = flow(
    azure.fromHttpRequest,
    TE.fromEither,
    TE.chain(requireCreateDossierPayload)
  );

  const encodeHttpResponse = flow(
    DossierToApiModel.encode,
    created(DossierDetailView)
  );

  return createHandler(
    decodeHttpRequest,
    createDossierUseCase,
    error,
    encodeHttpResponse
  );
};

const configOrError = pipe(
  getConfigFromEnvironment(process.env),
  E.getOrElseW(identity)
);

if (configOrError instanceof Error) {
  throw configOrError;
}

const config = configOrError;

const cosmosClient = new CosmosClient(config.azure.cosmos.connectionString);
const database = cosmosClient.database(config.azure.cosmos.dbName);

export const run = pipe(makeCreateDossierHandler(database), azure.unsafeRun);
