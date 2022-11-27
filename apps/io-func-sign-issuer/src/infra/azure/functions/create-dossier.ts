import { Database as CosmosDatabase } from "@azure/cosmos";

import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { sequenceS } from "fp-ts/lib/Apply";
import { flow, pipe } from "fp-ts/lib/function";

import { createHandler } from "@pagopa/handler-kit";
import { HttpRequest } from "@pagopa/handler-kit/lib/http";
import * as azure from "@pagopa/handler-kit/lib/azure";

import { validate } from "@internal/io-sign/validation";
import { created, error } from "@internal/io-sign/infra/http/response";
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
import { CreateDossierBody } from "../../http/models/CreateDossierBody";
import { Dossier } from "../../../dossier";
import { database } from "../cosmos/client";

const makeCreateDossierHandler = (db: CosmosDatabase) => {
  const createDossierUseCase = pipe(db, makeInsertDossier, makeCreateDossier);

  const requireDossierTitle = flow(
    (req: HttpRequest) => req.body,
    validate(CreateDossierBody),
    E.map((body) => body.title),
    E.chain(validate(Dossier.props.title))
  );

  const requireCreateDossierPayload: RTE.ReaderTaskEither<
    HttpRequest,
    Error,
    CreateDossierPayload
  > = sequenceS(RTE.ApplyPar)({
    issuer: makeRequireIssuer(mockGetIssuerBySubscriptionId),
    title: RTE.fromReaderEither(requireDossierTitle),
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

export const run = pipe(makeCreateDossierHandler(database), azure.unsafeRun);
