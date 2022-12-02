import { flow, pipe } from "fp-ts/lib/function";

import * as azure from "@pagopa/handler-kit/lib/azure";

import * as TE from "fp-ts/lib/TaskEither";

import { createHandler } from "@pagopa/handler-kit";

import { error, success } from "@internal/io-sign/infra/http/response";

import { QtspClausesMetadataToApiModel } from "../../http/encoders/qtsp-clauses-metadata";
import { QtspClausesMetadataDetailView } from "../../http/models/QtspClausesMetadataDetailView";
import { makeGetClausesWithToken, makeGetToken } from "../../namirial/client";
import { NamirialConfig } from "../../namirial/config";
import { ClausesMetadata } from "../../namirial/clauses-metadata";
import { QtspClausesMetadata } from "../../../qtsp-clauses-metadata";

const defaultGetQtspClausesWithToken = makeGetClausesWithToken()(
  makeGetToken()
);

const encodeHttpSuccessResponse = flow(
  QtspClausesMetadataToApiModel.encode,
  success(QtspClausesMetadataDetailView)
);

const decodeHttpRequest = flow(azure.fromHttpRequest, TE.fromEither);

const NamirialClausesToQtspClauses = (
  res: ClausesMetadata
): QtspClausesMetadata => ({
  clauses: res.clauses,
  documentUrl: res.document_link,
  privacyUrl: res.privacy_link,
  termsAndConditionsUrl: res.terms_and_conditions_link,
  privacyText: res.privacy_text,
  nonce: res.nonce,
});

export const makeGetQtspClausesMetadataFunction = (
  config: NamirialConfig,
  getQtspClausesWithToken = defaultGetQtspClausesWithToken
) =>
  pipe(
    createHandler(
      decodeHttpRequest,
      () =>
        pipe(
          getQtspClausesWithToken(config),
          TE.map(NamirialClausesToQtspClauses)
        ),
      error,
      encodeHttpSuccessResponse
    ),
    azure.unsafeRun
  );
