import { flow, pipe } from "fp-ts/lib/function";

import * as azure from "@pagopa/handler-kit/lib/azure";

import * as TE from "fp-ts/lib/TaskEither";

import { createHandler } from "@pagopa/handler-kit";

import { error, success } from "@internal/io-sign/infra/http/response";

import { QtspClausesMetadataToApiModel } from "../../http/encoders/qtsp-clauses-metadata";
import { QtspClausesMetadataDetailView } from "../../http/models/QtspClausesMetadataDetailView";

import { NamirialClient } from "../../namirial/client";
import { makeGetQtspClausesMetadata } from "../../../app/use-cases/get-qts-clauses-metadata";

const makeGetQtspClausesMetadataHandler = (namirialClient: NamirialClient) => {
  const getQtspClauses = makeGetQtspClausesMetadata(namirialClient);

  const decodeHttpRequest = flow(azure.fromHttpRequest, TE.fromEither);

  const encodeHttpSuccessResponse = flow(
    QtspClausesMetadataToApiModel.encode,
    success(QtspClausesMetadataDetailView)
  );

  return createHandler(
    decodeHttpRequest,
    getQtspClauses,
    error,
    encodeHttpSuccessResponse
  );
};

export const makeGetQtspClausesMetadataFunction = (
  namirialClient: NamirialClient
) => pipe(makeGetQtspClausesMetadataHandler(namirialClient), azure.unsafeRun);
