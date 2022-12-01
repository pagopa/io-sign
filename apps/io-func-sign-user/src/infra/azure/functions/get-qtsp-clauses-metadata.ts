import { flow, pipe } from "fp-ts/lib/function";

import * as azure from "@pagopa/handler-kit/lib/azure";

import * as TE from "fp-ts/lib/TaskEither";

import { createHandler } from "@pagopa/handler-kit";

import { error, success } from "@internal/io-sign/infra/http/response";

import { QtspClausesMetadataToApiModel } from "../../http/encoders/qtsp-clauses-metadata";
import { QtspClausesMetadataDetailView } from "../../http/models/QtspClausesMetadataDetailView";

import { QtspClient } from "../../qtsp/client";

const makeGetQtspClausesMetadataHandler = (qtspClient: QtspClient) => {
  const getQtspClauses = () =>
    pipe(
      qtspClient.getClauses(),
      TE.map((res) => ({
        clauses: res.clauses,
        documentUrl: res.document_link,
        privacyUrl: res.privacy_link,
        termsAndConditionsUrl: res.terms_and_conditions_link,
        privacyText: res.privacy_text,
        nonce: res.nonce,
      }))
    );

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

export const makeGetQtspClausesMetadataFunction = (qtspClient: QtspClient) =>
  pipe(makeGetQtspClausesMetadataHandler(qtspClient), azure.unsafeRun);
