import { HttpRequest, path } from "@pagopa/handler-kit/lib/http";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import {
  GetSignatureRequest,
  SignatureRequest,
  signatureRequestNotFoundError,
} from "../../../signature-request";

import { pipe, flow } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";
import { GetIssuerBySubscriptionId } from "../../../issuer";
import { makeRequireIssuer } from "./issuer";

import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { validate } from "@pagopa/handler-kit/lib/validation";

const requireSignatureRequestIdFromPath = flow(
  path("signatureRequestId"),
  E.fromOption(() => new Error(`missing "id" in path`)),
  E.chainW(validate(SignatureRequest.props.id, `invalid "id" supplied`))
);

export const makeRequireSignatureRequest = (
  getIssuerBySubscriptionId: GetIssuerBySubscriptionId,
  getSignatureRequest: GetSignatureRequest
): RTE.ReaderTaskEither<HttpRequest, Error, SignatureRequest> => {
  const requireIssuer = makeRequireIssuer(getIssuerBySubscriptionId);
  return pipe(
    sequenceS(RTE.ApplyPar)({
      issuer: requireIssuer,
      signatureRequestId: RTE.fromReaderEither(
        requireSignatureRequestIdFromPath
      ),
    }),
    RTE.chainTaskEitherK(({ issuer, signatureRequestId }) =>
      pipe(
        issuer.id,
        getSignatureRequest(signatureRequestId),
        TE.chain(TE.fromOption(() => signatureRequestNotFoundError))
      )
    )
  );
};
