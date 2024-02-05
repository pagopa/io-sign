import { header, HttpRequest } from "handler-kit-legacy/lib/http";

import { validate } from "@io-sign/io-sign/validation";

import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import * as E from "fp-ts/lib/Either";

import { HttpBadRequestError } from "@io-sign/io-sign/infra/http/errors";
import { sequenceS } from "fp-ts/lib/Apply";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { LollipopSignatureInput } from "../models/LollipopSignatureInput";
import { LollipopSignature } from "../models/LollipopSignature";
import { LollipopJWTAuthorization } from "../models/LollipopJWTAuthorization";
import { LollipopAssertionRef } from "../models/LollipopAssertionRef";
import { AssertionType } from "../models/AssertionType";
import { LollipopPublicKey } from "../models/LollipopPublicKey";

const requireParameterFromHeader =
  <T>(headerName: string, schema: t.Decoder<unknown, T>) =>
  (req: HttpRequest) =>
    pipe(
      req,
      header(headerName),
      E.fromOption(
        () => new HttpBadRequestError(`Missing "${headerName}" in header`)
      ),
      E.chainW(
        validate(schema, `"${headerName}" header is not a valid ${schema.name}`)
      )
    );

export const BasicLollipopParams = t.type({
  signatureInput: LollipopSignatureInput,
  signature: LollipopSignature,
  jwtAuthorization: LollipopJWTAuthorization,
  assertionRef: LollipopAssertionRef,
  assertionType: AssertionType,
  publicKey: LollipopPublicKey,
});

export type BasicLollipopParams = t.TypeOf<typeof BasicLollipopParams>;

export const CreateSignatureLollipopParams = t.intersection([
  BasicLollipopParams,
  t.type({
    tosChallenge: NonEmptyString,
    signChallenge: NonEmptyString,
  }),
]);

export type CreateSignatureLollipopParams = t.TypeOf<
  typeof CreateSignatureLollipopParams
>;

export const requireBasicLollipopParams = (
  request: HttpRequest
): E.Either<Error, BasicLollipopParams> =>
  pipe(
    sequenceS(E.Applicative)({
      signatureInput: pipe(
        request,
        requireParameterFromHeader("signature-input", LollipopSignatureInput)
      ),
      signature: pipe(
        request,
        requireParameterFromHeader("signature", LollipopSignature)
      ),
      jwtAuthorization: pipe(
        request,
        requireParameterFromHeader(
          "x-pagopa-lollipop-auth-jwt",
          LollipopJWTAuthorization
        )
      ),
      assertionRef: pipe(
        request,
        requireParameterFromHeader(
          "x-pagopa-lollipop-assertion-ref",
          LollipopAssertionRef
        )
      ),
      assertionType: pipe(
        request,
        requireParameterFromHeader(
          "x-pagopa-lollipop-assertion-type",
          AssertionType
        )
      ),
      publicKey: pipe(
        request,
        requireParameterFromHeader(
          "x-pagopa-lollipop-public-key",
          LollipopPublicKey
        )
      ),
    })
  );

export const requireCreateSignatureLollipopParams = (
  request: HttpRequest
): E.Either<Error, CreateSignatureLollipopParams> =>
  pipe(
    request,
    requireBasicLollipopParams,
    E.chainW((lollipopBasic) =>
      pipe(
        sequenceS(E.Applicative)({
          tosChallenge: pipe(
            request,
            requireParameterFromHeader(
              "x-pagopa-lollipop-custom-tos-challenge",
              NonEmptyString
            )
          ),
          signChallenge: pipe(
            request,
            requireParameterFromHeader(
              "x-pagopa-lollipop-custom-sign-challenge",
              NonEmptyString
            )
          ),
        }),
        E.map((createSignatureLollipopParams) => ({
          ...lollipopBasic,
          ...createSignatureLollipopParams,
        }))
      )
    )
  );
