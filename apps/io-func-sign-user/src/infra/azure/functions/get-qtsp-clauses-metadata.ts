import { flow, pipe } from "fp-ts/lib/function";

import * as azure from "@pagopa/handler-kit/lib/azure";

import * as TE from "fp-ts/lib/TaskEither";

import { createHandler } from "@pagopa/handler-kit";

import { error, success } from "@internal/io-sign/infra/http/response";

import { HttpBadRequestError } from "@internal/io-sign/infra/http/errors";
import { QtspClausesMetadataToApiModel } from "../../http/encoders/qtsp-clauses-metadata";
import { QtspClausesMetadataDetailView } from "../../http/models/QtspClausesMetadataDetailView";
import { makeGetClausesWithToken, makeGetToken } from "../../namirial/client";
import { NamirialConfig } from "../../namirial/config";
import { NamirialClausesToQtspClauses } from "../../http/encoders/namirial-clauses-metadata";

const getQtspClausesWithToken = makeGetClausesWithToken()(makeGetToken());

const encodeHttpSuccessResponse = flow(
  QtspClausesMetadataToApiModel.encode,
  success(QtspClausesMetadataDetailView)
);

const decodeHttpRequest = flow(azure.fromHttpRequest, TE.fromEither);

export const makeGetQtspClausesMetadataFunction = (config: NamirialConfig) =>
  pipe(
    createHandler(
      decodeHttpRequest,
      () =>
        pipe(
          getQtspClausesWithToken(config),
          TE.map(NamirialClausesToQtspClauses.encode),
          TE.mapLeft((e) => new HttpBadRequestError(e.message))
        ),
      error,
      encodeHttpSuccessResponse
    ),
    azure.unsafeRun
  );
