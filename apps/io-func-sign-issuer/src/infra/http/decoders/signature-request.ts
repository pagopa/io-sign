import { HttpRequest, path } from "@pagopa/handler-kit/lib/http";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { pipe, flow } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";

import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

import { validate } from "@internal/io-sign/validation";

import { GetIssuerBySubscriptionId } from "../../../issuer";
import {
  GetSignatureRequest,
  SignatureRequest,
} from "../../../signature-request";
import { makeRequireIssuer } from "./issuer";
import { EntityNotFoundError } from "@internal/io-sign/error";

const requireSignatureRequestIdFromPath = flow(
  path("signatureRequestId"),
  E.fromOption(() => new Error(`Missing "id" in path`)),
  E.chainW(
    validate(SignatureRequest.types[0].props.id, `Invalid "id" supplied.`)
  )
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
        TE.chain(
          TE.fromOption(
            () =>
              new EntityNotFoundError(
                "The specified Signature Request does not exists."
              )
          )
        )
      )
    )
  );
};
