import * as cosmos from "@azure/cosmos";

import { flow, pipe } from "fp-ts/lib/function";

import { path, error, success } from "@pagopa/handler-kit/lib/http";
import * as azure from "@pagopa/handler-kit/lib/azure";

import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as O from "fp-ts/lib/Option";

import { validate } from "@pagopa/handler-kit/lib/validation";
import { Dossier, dossierNotFoundError } from "../../../dossier";
import { makeGetDossier } from "../cosmos/dossier";
import { sequenceS } from "fp-ts/lib/Apply";
import { makeRequireIssuer } from "../../http/decoders/issuer";
import { createHandler } from "@pagopa/handler-kit";
import { DossierToApiModel } from "../../http/encoders/dossier";
import { DossierDetailView } from "../../http/models/DossierDetailView";

import { mockGetIssuerBySubscriptionId } from "../../__mocks__/issuer";

const makeGetDossierHandler = (database: cosmos.Database) => {
  const getDossier = makeGetDossier(database);

  const requireIssuer = makeRequireIssuer(mockGetIssuerBySubscriptionId);

  const requireDossierId = flow(
    path("dossierId"),
    E.fromOption(() => new Error(`missing "id" in path`)),
    E.chainW(validate(Dossier.props.id, `invalid "id" supplied`))
  );

  const requireGetDossierPayload = sequenceS(RTE.ApplyPar)({
    issuer: requireIssuer,
    dossierId: RTE.fromReaderEither(requireDossierId),
  });

  const decodeHttpRequest = flow(
    azure.fromHttpRequest,
    TE.fromEither,
    TE.chain(requireGetDossierPayload)
  );

  const encodeHttpRequest = (maybeDossier: O.Option<Dossier>) =>
    pipe(
      maybeDossier,
      E.fromOption(() => dossierNotFoundError),
      E.fold(error, flow(DossierToApiModel.encode, success(DossierDetailView)))
    );

  return createHandler(
    decodeHttpRequest,
    ({ issuer, dossierId }) => pipe(issuer.id, getDossier(dossierId)),
    error,
    encodeHttpRequest
  );
};

export const makeGetDossierAzureFunction = flow(
  makeGetDossierHandler,
  azure.unsafeRun
);
