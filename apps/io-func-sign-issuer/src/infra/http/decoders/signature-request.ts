import * as H from "@pagopa/handler-kit";
import { HttpRequest, path } from "handler-kit-legacy/lib/http";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { pipe, flow } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";
import { lookup } from "fp-ts/lib/Record";

import * as E from "fp-ts/lib/Either";

import { validate } from "@io-sign/io-sign/validation";

import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { SignatureRequestId } from "@io-sign/io-sign/signature-request";
import { GetIssuerBySubscriptionId } from "../../../issuer";

import {
  GetSignatureRequest,
  SignatureRequest,
} from "../../../signature-request";

import { makeRequireIssuer } from "./issuer";

// TODO: replace with requireSignatureRequestId
const requireSignatureRequestIdFromPath = flow(
  path("signatureRequestId"),
  E.fromOption(() => new Error(`Missing "id" in path`)),
  E.chainW(validate(SignatureRequestId, `Invalid "id" supplied.`)),
);

export const makeRequireSignatureRequest = (
  getIssuerBySubscriptionId: GetIssuerBySubscriptionId,
  getSignatureRequest: GetSignatureRequest,
): RTE.ReaderTaskEither<HttpRequest, Error, SignatureRequest> => {
  const requireIssuer = makeRequireIssuer(getIssuerBySubscriptionId);
  return pipe(
    sequenceS(RTE.ApplyPar)({
      issuer: requireIssuer,
      signatureRequestId: RTE.fromReaderEither(
        requireSignatureRequestIdFromPath,
      ),
    }),
    RTE.chainTaskEitherK(({ issuer, signatureRequestId }) =>
      pipe(issuer.id, getSignatureRequest(signatureRequestId)),
    ),
    RTE.chainW(
      RTE.fromOption(
        () =>
          new EntityNotFoundError(
            "The specified Signature Request does not exists.",
          ),
      ),
    ),
  );
};

export const requireSignatureRequestId = (req: H.HttpRequest) =>
  pipe(
    req.path,
    lookup("signatureRequestId"),
    RTE.fromOption(() => new H.HttpBadRequestError(`Missing "id" in path`)),
    RTE.chainEitherKW(H.parse(SignatureRequestId, `Invalid "id" supplied`)),
  );
