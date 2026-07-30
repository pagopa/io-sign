import { flow, pipe } from "fp-ts/lib/function";

import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as L from "@pagopa/logger";

import {
  HttpBadRequestError,
  HttpNotFoundError
} from "@io-sign/io-sign/infra/http/errors";

import { ConsoleLogger } from "@io-sign/io-sign/infra/console-logger";
import { stringToBase64Encode } from "@io-sign/io-sign/utility";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { validate } from "@io-sign/io-sign/validation";
import { LollipopAssertionRef } from "../http/models/LollipopAssertionRef";
import { LollipopJWTAuthorization } from "../http/models/LollipopJWTAuthorization";
import { LollipopApiClientExt } from "./client";
import { LollipopAuthBearer } from "./models/LollipopAuthBearer";
import { AssertionType, AssertionTypeEnum } from "./models/AssertionType";
import { LCUserInfo } from "./models/LCUserInfo";
import { SamlUserInfo } from "./models/SamlUserInfo";

export type GetSamlAssertion = ({
  assertionRef,
  jwtAuthorization,
  assertionType
}: LollipopParamsForSaml) => TE.TaskEither<Error, NonEmptyString>;
type LollipopParamsForSaml = {
  assertionRef: LollipopAssertionRef;
  jwtAuthorization: LollipopJWTAuthorization;
  assertionType: AssertionType;
};

export const isAssertionSaml =
  (type: AssertionType) =>
  (assertion: LCUserInfo): assertion is SamlUserInfo =>
    type === AssertionTypeEnum.SAML && SamlUserInfo.is(assertion);

export const makeGetBase64SamlAssertion =
  (lollipopClient: LollipopApiClientExt): GetSamlAssertion =>
  ({ assertionRef, jwtAuthorization, assertionType }) =>
    pipe(
      TE.tryCatch(
        () =>
          lollipopClient.client.getAssertion({
            assertion_ref: assertionRef,
            "x-pagopa-lollipop-auth":
              `Bearer ${jwtAuthorization}` as LollipopAuthBearer
          }),
        E.toError
      ),
      TE.chainEitherK(
        flow(
          E.mapLeft(
            () =>
              new Error("Unable to retrieve the assertion from lollipop api.")
          ),
          E.chainW((response) => {
            switch (response.status) {
              case 200:
                return E.right(response.value);
              case 404:
                return E.left(
                  new HttpNotFoundError(`Lollipop user assertion not found.`)
                );
              default:
                L.error("getAssertion unexpected response", {
                  status: response.status,
                  body: response.value
                })({ logger: ConsoleLogger })();
                return E.left(
                  new HttpBadRequestError(
                    `The attempt to get lollipop user assertion failed.`
                  )
                );
            }
          })
        )
      ),
      TE.chain((assertion) =>
        isAssertionSaml(assertionType)(assertion)
          ? TE.of(assertion.response_xml)
          : TE.left(new HttpBadRequestError(`OIDC Claims not supported yet.`))
      ),
      TE.chainEitherK(stringToBase64Encode),
      TE.chainEitherKW(validate(NonEmptyString, "Saml assertion is not valid"))
    );

// Matches the first `keyid` value in a `signature-input` header
// e.g. sig1=(...);keyid="sha256-abc...";nonce="xyz"
const KEY_ID_REGEX = /;?keyid="([^"]+)";?/;

/**
 * Returns the hash algorithm prefix of an AssertionRef.
 * e.g. "sha256-abc..." → "sha256"
 */
export const getAlgoFromAssertionRef = (
  assertionRef: LollipopAssertionRef
): string => assertionRef.split("-")[0];

/**
 * Extracts the public-key thumbprint from the `keyid` field of a
 * `signature-input` header value.
 */
export const getKeyThumbprintFromSignature = (
  signatureInput: string
): E.Either<Error, string> => {
  const match = KEY_ID_REGEX.exec(signatureInput);
  return match?.[1]
    ? E.right(match[1])
    : E.left(
        new Error('Missing or invalid "keyid" in "signature-input" header')
      );
};
