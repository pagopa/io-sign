import { flow, pipe } from "fp-ts/lib/function";

import * as O from "fp-ts/lib/Option";
import * as S from "fp-ts/lib/string";

import * as RA from "fp-ts/lib/ReadonlyArray";

import { LollipopSignature } from "../http/models/LollipopSignature";
import { LollipopSignatureInput } from "../http/models/LollipopSignatureInput";

const getRegexFromSignatureId = (signatureId: string) =>
  new RegExp(`${signatureId}:[A-Za-z0-9+/=]*:?`);

/* Given a LollipopSignature es: `sig1=:SIGNATURE_1:,sig2=:SIGNATURE_2:,sig3=:....` and a signatureInput like:
 * `sig1=("content-type").....,sig2=("CUSTOM_HEADER_NAME");created=...,sig3=("CUSTOM_HEADER_NAME_2");created=...`
 * return the signature (es: SIGNATURE_2) associated with the single header name (es: CUSTOM_HEADER_NAME)
 */
export const getSignatureFromSingleHeaderName = (
  signatureInput: LollipopSignatureInput,
  sigantures: LollipopSignature,
  headerName: string
) =>
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
      flow(getRegexFromSignatureId, (re) => re.exec(sigantures), O.fromNullable)
    ),
    O.chain(RA.head),
    O.chain(
      flow(
        S.split(/[::]/),
        RA.filterWithIndex((i) => i === 1),
        RA.head
      )
    )
  );
