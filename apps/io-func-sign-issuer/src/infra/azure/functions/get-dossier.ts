import { Database as CosmosDatabase } from "@azure/cosmos";

import { flow, pipe } from "fp-ts/lib/function";

import { validate } from "@internal/io-sign/validation";

import * as azure from "@pagopa/handler-kit/lib/azure";

import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { sequenceS } from "fp-ts/lib/Apply";
import { createHandler } from "@pagopa/handler-kit";
import { path } from "@pagopa/handler-kit/lib/http";
import { error, success } from "@internal/io-sign/infra/http/response";
import { EntityNotFoundError } from "@internal/io-sign/error";
import { Dossier } from "../../../dossier";
import { makeGetDossier } from "../cosmos/dossier";
import { makeRequireIssuer } from "../../http/decoders/issuer";
import { DossierDetailView } from "../../http/models/DossierDetailView";

import { mockGetIssuerBySubscriptionId } from "../../__mocks__/issuer";

import { DossierToApiModel } from "../../http/encoders/dossier";
import { database } from "../cosmos/client";

const makeGetDossierHandler = (database: CosmosDatabase) => {
  const getDossier = makeGetDossier(database);

  const requireIssuer = makeRequireIssuer(mockGetIssuerBySubscriptionId);

  const requireDossierId = flow(
    path("dossierId"),
    E.fromOption(() => new Error(`Missing "id" in path.`)),
    E.chainW(validate(Dossier.props.id, `Invalid "id" supplied.`))
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

  return createHandler(
    decodeHttpRequest,
    ({ issuer, dossierId }) =>
      pipe(
        issuer.id,
        getDossier(dossierId),
        TE.chain(
          TE.fromOption(
            () =>
              new EntityNotFoundError("The specified Dossier does not exists.")
          )
        )
      ),
    error,
    flow(DossierToApiModel.encode, success(DossierDetailView))
  );
};

export const run = pipe(makeGetDossierHandler(database), azure.unsafeRun);
