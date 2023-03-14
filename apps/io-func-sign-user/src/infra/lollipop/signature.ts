import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as S from "fp-ts/lib/string";

import * as RA from "fp-ts/lib/ReadonlyArray";

import { validate } from "@io-sign/io-sign/validation";
import { NonEmptyString, PatternString } from "@pagopa/ts-commons/lib/strings";
import { LollipopSignature } from "../http/models/LollipopSignature";
import { LollipopSignatureInput } from "../http/models/LollipopSignatureInput";

export type LollipopSignaturePrefix = t.TypeOf<typeof LollipopSignaturePrefix>;
export const LollipopSignaturePrefix = PatternString("^sig[0-9]+=");

const getSignRegexFromSignaturePrefix = (
  signaturePrefix: LollipopSignaturePrefix
) => new RegExp(`${signaturePrefix}:([^:]+)`);

/* Given a signature input: sig1=("FooBar"),sig2=("DeadBeef")
 * and the header name: FooBar
 * return the signature prefix with index: sig1=
 */
export const getSignaturePrefixFromHeaderName =
  (signatureInput: LollipopSignatureInput) => (headerName: string) =>
    pipe(
      signatureInput,
      S.split(","),
      RA.filterMapWithIndex((index: number, signatureInput: string) =>
        pipe(signatureInput, S.startsWith(`sig${index + 1}=("${headerName}")`))
          ? O.some(`sig${index + 1}=`)
          : O.none
      ),
      RA.head,
      O.chain(
        O.fromEitherK(
          validate(LollipopSignaturePrefix, "Invalid signature prefix")
        )
      )
    );

/* Given a signatures string: sig1=:SomeValue:,sig2=:SomeOtherValue:
 * and the signature prefix with index: sig1=
 * extract the value part: SomeValue
 */
export const getSignatureFromPrefix =
  (signatures: LollipopSignature) =>
  (signaturePrefix: LollipopSignaturePrefix) =>
    pipe(
      getSignRegexFromSignaturePrefix(signaturePrefix),
      (re) => re.exec(signatures),
      O.fromNullable,
      O.chain(RA.lookup(1))
    );

/* Given a LollipopSignature es: `sig1=:SIGNATURE_1:,sig2=:SIGNATURE_2:,sig3=:....` and a signatureInput like:
 * `sig1=("content-type").....,sig2=("CUSTOM_HEADER_NAME_1");created=...,sig3=("CUSTOM_HEADER_NAME_2");created=...`
 * return the signature (es: SIGNATURE_2) associated with the header name (es: CUSTOM_HEADER_NAME_1)
 */
export const getSignatureFromHeaderName = (
  signatureInput: LollipopSignatureInput,
  signatures: LollipopSignature,
  headerName: string
) =>
  pipe(
    headerName,
    getSignaturePrefixFromHeaderName(signatureInput),
    O.chain(getSignatureFromPrefix(signatures)),
    E.fromOption(
      () => new Error(`Signature of "${headerName}" header not found`)
    ),
    E.chainW(
      validate(
        NonEmptyString,
        `Signature of "${headerName}" is not a valid signature`
      )
    )
  );
