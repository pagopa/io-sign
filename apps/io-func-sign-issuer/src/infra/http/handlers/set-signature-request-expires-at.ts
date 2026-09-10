import * as H from "@pagopa/handler-kit";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { pipe } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";
import { validate } from "@io-sign/io-sign/validation";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import { SetSignatureRequestExpiresAtBody } from "../models/SetSignatureRequestExpiresAtBody";
import {
  getSignatureRequest,
  patchSignatureRequestExpiresAt,
  validateExpiryDate
} from "../../../signature-request";
import { requireIssuer } from "../decoders/issuer";
import { requireSignatureRequestId } from "../decoders/signature-request";

const requireSetSignatureRequestExpiresAtBody = (req: H.HttpRequest) =>
  pipe(req.body, validate(SetSignatureRequestExpiresAtBody));

export const SetSignatureRequestExpiresAtHandler = H.of((req: H.HttpRequest) =>
  pipe(
    sequenceS(RTE.ApplyPar)({
      id: requireSignatureRequestId(req),
      issuer: requireIssuer(req),
      body: pipe(requireSetSignatureRequestExpiresAtBody(req), RTE.fromEither)
    }),
    RTE.bindW("request", ({ id, issuer }) =>
      getSignatureRequest(id, issuer.id)
    ),
    RTE.chainW(({ id, issuer, request, body }) =>
      pipe(
        validateExpiryDate(body.expires_at)(request),
        RTE.fromEither,
        RTE.chainW((expiresAt) =>
          patchSignatureRequestExpiresAt(id, issuer.id, expiresAt)
        )
      )
    ),
    RTE.map(() => H.empty),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
