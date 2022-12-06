import {
  EmailString,
  FiscalCode,
  NonEmptyString,
} from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";
import { NonNegativeNumber } from "@pagopa/ts-commons/lib/numbers";
import { SignatureField } from "./document-to-sign";

interface IMinMaxArray<T> extends Array<T> {
  readonly minMaxArray: unique symbol;
}

const minMaxArray = <C extends t.Mixed>(min: number, max: number, a: C) =>
  t.brand(
    t.array(a),
    (n: C[]): n is t.Branded<C[], IMinMaxArray<C>> =>
      min < n.length && n.length < max,
    "minMaxArray"
  );

export const QtspClauses = t.type({
  acceptedClauses: t.array(t.type({ text: NonEmptyString })),
  filledDocumentUrl: NonEmptyString,
  nonce: NonEmptyString,
});
export type QtspClauses = t.TypeOf<typeof QtspClauses>;

export const QtspClause = t.type({
  text: NonEmptyString,
});
export type QtspClause = t.TypeOf<typeof QtspClause>;

export const QtspClausesMetadata = t.type({
  clauses: t.array(QtspClause),
  documentUrl: NonEmptyString,
  privacyUrl: NonEmptyString,
  termsAndConditionsUrl: NonEmptyString,
  privacyText: NonEmptyString,
  nonce: NonEmptyString,
});
export type QtspClausesMetadata = t.TypeOf<typeof QtspClausesMetadata>;

export const QtspSignatureCoordinate = t.type({
  page: NonNegativeNumber,
  position: minMaxArray(4, 4, NonNegativeNumber),
});
export type QtspSignatureCoordinate = t.TypeOf<typeof QtspSignatureCoordinate>;

export const QtspDocumentToSign = t.type({
  urlIn: NonEmptyString,
  urlOut: NonEmptyString,
  signatureFields: t.array(SignatureField),
});
export type QtspDocumentToSign = t.TypeOf<typeof QtspDocumentToSign>;

export const QtspCreateSignaturePayload = t.type({
  fiscalCode: FiscalCode,
  publicKey: NonEmptyString,
  spidAssertion: NonEmptyString,
  email: EmailString,
  documentLink: NonEmptyString,
  nonce: NonEmptyString,
  tosSignature: NonEmptyString,
  signature: NonEmptyString,
  documentsToSign: t.array(QtspDocumentToSign),
});
export type QtspCreateSignaturePayload = t.TypeOf<
  typeof QtspCreateSignaturePayload
>;
