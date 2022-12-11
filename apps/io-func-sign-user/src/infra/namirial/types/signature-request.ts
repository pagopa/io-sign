import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";
import { NonNegativeNumber } from "@pagopa/ts-commons/lib/numbers";
import {
  EmailString,
  FiscalCode,
  NonEmptyString,
} from "@pagopa/ts-commons/lib/strings";

import * as t from "io-ts";

export const SignatureCoordinate = t.type({
  page: NonNegativeNumber,
  position: t.array(t.number),
});

export type SignatureCoordinate = t.TypeOf<typeof SignatureCoordinate>;

export const DocumentToSign = t.type({
  url_in: NonEmptyString,
  url_out: NonEmptyString,
  signature_fields: t.array(t.string),
  signature_coordinates: t.array(SignatureCoordinate),
  signatures_type: t.literal("PADES-T"),
  appearance_alias: t.literal("appio"),
});

export type DocumentToSign = t.TypeOf<typeof DocumentToSign>;

export const Signature = t.type({
  signed_challenge: NonEmptyString,
  signatures_type: t.literal("PADES"),
  documents_to_sign: t.array(DocumentToSign),
});

export type Signature = t.TypeOf<typeof Signature>;

export const CreateSignatureRequestBody = t.type({
  fiscal_code: FiscalCode,
  public_key: NonEmptyString,
  SAML_assertion: NonEmptyString,
  email: EmailString,
  document_link: NonEmptyString,
  nonce: NonEmptyString,
  tos_signature: NonEmptyString,
  signatures: Signature,
});

export type CreateSignatureRequestBody = t.TypeOf<
  typeof CreateSignatureRequestBody
>;

enum SignatureRequestStatus {
  CREATED = "CREATED",
  READY = "READY",
  WAITING = "WAITING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

const SignatureRequestStatusV = t.keyof({
  [SignatureRequestStatus.CREATED]: null,
  [SignatureRequestStatus.READY]: null,
  [SignatureRequestStatus.WAITING]: null,
  [SignatureRequestStatus.COMPLETED]: null,
  [SignatureRequestStatus.FAILED]: null,
});

export const SignatureRequest = t.type({
  id: NonEmptyString,
  created_at: IsoDateFromString,
  status: SignatureRequestStatusV,
  last_error: t.union([
    t.type({
      code: t.number,
      detail: t.string,
    }),
    t.null,
  ]),
});

export type SignatureRequest = t.TypeOf<typeof SignatureRequest>;
