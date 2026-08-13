import * as H from "@pagopa/handler-kit";

import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";

import { flow, pipe } from "fp-ts/lib/function";
import { lookup } from "fp-ts/Record";

import { IssuerEnvironment } from "@io-sign/io-sign/issuer";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";

import { makeGetClausesWithToken, makeGetToken } from "../../namirial/client";
import { getNamirialCredentialsFromIssuerEnvironment } from "../../namirial/config";
import { NamirialClausesToQtspClauses } from "../encoders/namirial-clauses-metadata";
import { QtspClausesMetadataToApiModel } from "../encoders/qtsp-clauses-metadata";

const getQtspClausesWithToken = makeGetClausesWithToken()(makeGetToken());

// TODO: [SFEQS-1557] The "TEST" fallback must be removed when the app will be
// updated with the new specifications.
const requireIssuerEnvironment = (
  req: H.HttpRequest
): E.Either<Error, IssuerEnvironment> =>
  pipe(
    req.headers,
    lookup("x-iosign-issuer-environment"),
    O.getOrElse(() => "TEST"),
    H.parse(IssuerEnvironment, "Invalid issuer environment")
  );

export const GetQtspClausesMetadataHandler = H.of((req: H.HttpRequest) =>
  pipe(
    requireIssuerEnvironment(req),
    RTE.fromEither,
    RTE.chainW((issuerEnvironment) =>
      flow(
        getNamirialCredentialsFromIssuerEnvironment(issuerEnvironment),
        getQtspClausesWithToken,
        TE.map(NamirialClausesToQtspClauses.encode),
        TE.mapLeft((e) => new H.HttpError(e.message))
      )
    ),
    RTE.map(flow(QtspClausesMetadataToApiModel.encode, H.successJson)),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
