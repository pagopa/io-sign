import { SignatureRequestId } from "@io-sign/io-sign/signature-request";
import { validate } from "@io-sign/io-sign/validation";
import { HttpRequest, path } from "@pagopa/handler-kit/lib/http";
import { sequenceS } from "fp-ts/lib/Apply";

import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as E from "fp-ts/lib/Either";
import * as RE from "fp-ts/lib/ReaderEither";
import { flow, pipe } from "fp-ts/lib/function";

const requireSignatureRequestIdFromPath = flow(
  path("signatureRequestId"),
  E.fromOption(() => new Error(`Missing "id" in path`)),
  E.chainW(validate(SignatureRequestId, `Invalid "id" supplied.`))
);

import { EntityNotFoundError } from "@io-sign/io-sign/error";
import {
  GetSignatureRequest,
  SignatureRequest,
} from "../../../signature-request";
import { requireSigner } from "./signer";

export const makeRequireSignatureRequest = (
  getSignatureRequest: GetSignatureRequest
): RTE.ReaderTaskEither<HttpRequest, Error, SignatureRequest> =>
  pipe(
    sequenceS(RE.Apply)({
      signer: requireSigner,
      signatureRequestId: requireSignatureRequestIdFromPath,
    }),
    RTE.fromReaderEither,
    RTE.chainTaskEitherK(({ signer, signatureRequestId }) =>
      pipe(signer.id, getSignatureRequest(signatureRequestId))
    ),
    RTE.chainW(
      RTE.fromOption(
        () =>
          new EntityNotFoundError(
            "The specified Signature Request does not exists."
          )
      )
    )
  );
