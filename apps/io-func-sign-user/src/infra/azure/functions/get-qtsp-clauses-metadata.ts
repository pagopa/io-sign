import { flow, identity, pipe } from "fp-ts/lib/function";

import * as azure from "handler-kit-legacy/lib/azure";

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import { createHandler } from "handler-kit-legacy";

import { error, success } from "@io-sign/io-sign/infra/http/response";

import {
  HttpBadRequestError,
  HttpError,
} from "@io-sign/io-sign/infra/http/errors";
import { header, HttpRequest } from "handler-kit-legacy/lib/http";
import { validate } from "@io-sign/io-sign/validation";

import { IssuerEnvironment } from "@io-sign/io-sign/issuer";
import { QtspClausesMetadataToApiModel } from "../../http/encoders/qtsp-clauses-metadata";
import { QtspClausesMetadataDetailView } from "../../http/models/QtspClausesMetadataDetailView";
import { makeGetClausesWithToken, makeGetToken } from "../../namirial/client";
import {
  getNamirialCredentialsFromIssuerEnvironment,
  NamirialConfig,
} from "../../namirial/config";
import { NamirialClausesToQtspClauses } from "../../http/encoders/namirial-clauses-metadata";

const getQtspClausesWithToken = makeGetClausesWithToken()(makeGetToken());

const encodeHttpSuccessResponse = flow(
  QtspClausesMetadataToApiModel.encode,
  success(QtspClausesMetadataDetailView)
);

const requireIssuerEnvironment = (req: HttpRequest) =>
  pipe(
    req,
    header("x-iosign-issuer-environment"),
    E.fromOption(
      () =>
        new HttpBadRequestError("Missing x-iosign-issuer-environment in header")
    ),
    // TODO: [SFEQS-1557] This default value must be removed when the app will be updated with the new specifications
    E.fold(() => "TEST", identity),
    validate(IssuerEnvironment, "Invalid issuer environment")
  );

const getQtspClausesMetadataFunction = (config: NamirialConfig) => {
  const decodeHttpRequest = flow(
    azure.fromHttpRequest,
    E.chainW(requireIssuerEnvironment),
    TE.fromEither
  );

  return createHandler(
    decodeHttpRequest,
    (issuerEnvironment) =>
      pipe(
        config,
        getNamirialCredentialsFromIssuerEnvironment(issuerEnvironment),
        getQtspClausesWithToken,
        TE.map(NamirialClausesToQtspClauses.encode),
        TE.mapLeft((e) => new HttpError(e.message))
      ),
    error,
    encodeHttpSuccessResponse
  );
};

export const makeGetQtspClausesMetadataFunction = flow(
  getQtspClausesMetadataFunction,
  azure.unsafeRun
);
