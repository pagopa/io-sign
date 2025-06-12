import * as H from "@pagopa/handler-kit";

import {
  ApplyPar,
  chainW,
  fromEither,
  map,
  orElseW
} from "fp-ts/lib/ReaderTaskEither";

import { flow, pipe } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import {
  IntegerFromString,
  WithinRangeInteger
} from "@pagopa/ts-commons/lib/numbers";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";
import { requireIssuer } from "../decoders/issuer";

import { requireDossierId } from "../decoders/dossier";
import { getDossierById } from "../../../dossier";
import { findSignatureRequestsByDossier } from "../../../signature-request";
import { SignatureRequestToListApiModel } from "../encoders/signature-request";

export const GetRequestsByDossierHandler = H.of((req: H.HttpRequest) =>
  pipe(
    sequenceS(ApplyPar)({
      issuer: requireIssuer(req),
      dossierId: requireDossierId(req),
      options: pipe(
        req.query,
        H.parse(
          t.partial({
            continuationToken: NonEmptyString,
            limit: IntegerFromString.pipe(WithinRangeInteger(25, 101))
          })
        ),
        fromEither,
        map(({ continuationToken, limit }) => ({
          continuationToken,
          maxItemCount: limit
        }))
      )
    }),
    chainW(({ dossierId, issuer, options }) =>
      pipe(
        getDossierById(dossierId, issuer.id),
        map((dossier) => ({ dossier, options }))
      )
    ),
    chainW(({ dossier, options }) =>
      findSignatureRequestsByDossier(dossier, options)
    ),
    map(flow(SignatureRequestToListApiModel.encode, H.successJson)),
    orElseW(logErrorAndReturnResponse)
  )
);
