import { flow, pipe } from "fp-ts/lib/function";

import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as S from "fp-ts/lib/string";

import * as RA from "fp-ts/lib/ReadonlyArray";

import { validate } from "@io-sign/io-sign/validation";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { LollipopSignature } from "../http/models/LollipopSignature";
import { LollipopSignatureInput } from "../http/models/LollipopSignatureInput";

const getSignRegexFromSignaturePrefix = (signaturePrefix: string) =>
  new RegExp(`${signaturePrefix}:[A-Za-z0-9+/=]*:?`);

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
    /* signatureInput field contains the parameters of all the signatures (sig1, sig2, ...) separated by comma
     * each one associated with one or more headers. Here therefore for each signatureParam a filter is first applied
     * to obtain signatureParam associated with a single header-name and subsequently a map is made to obtain only
     * the signature prefix (e.g. sig1=)
     */
    signatureInput,
    S.split(","),
    RA.filterMapWithIndex((index: number, signatureInput: string) =>
      pipe(signatureInput, S.startsWith(`sig${index + 1}=("${headerName}")`))
        ? O.some(`sig${index + 1}=`)
        : O.none
    ),
    RA.head,
    O.chain(
      flow(
        getSignRegexFromSignaturePrefix,
        (re) => re.exec(signatures),
        O.fromNullable
      )
    ),
    O.chain(RA.head),
    O.chain(
      flow(
        S.split(/[::]/),
        RA.filterWithIndex((i) => i === 1),
        RA.head
      )
    ),
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
