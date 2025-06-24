import * as t from "io-ts";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";

import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";

import { Id, id as newId } from "@io-sign/io-sign/id";

import { Signer } from "@io-sign/io-sign/signer";
import { NonEmptyString, PatternString } from "@pagopa/ts-commons/lib/strings";

const SignatureStatusV = t.keyof({
  CREATED: null,
  READY: null,
  WAITING: null,
  COMPLETED: null,
  FAILED: null
});

export type SignatureStatus = t.TypeOf<typeof SignatureStatusV>;

export const Signature = t.intersection([
  t.type({
    id: Id,
    signerId: Signer.props.id,
    signatureRequestId: Id,
    qtspSignatureRequestId: Id,
    status: SignatureStatusV,
    createdAt: IsoDateFromString,
    updatedAt: IsoDateFromString
  }),
  t.partial({
    rejectedReason: t.string
  })
]);

export type Signature = t.TypeOf<typeof Signature>;

export const SignatureNotification = t.type({
  signatureId: Id,
  signerId: Signer.props.id
});

export type SignatureNotification = t.TypeOf<typeof SignatureNotification>;

export const newSignature = (
  signer: Signer,
  signatureRequestId: Id,
  qtspSignatureRequestId: Id
): Signature => ({
  id: newId(),
  signerId: signer.id,
  signatureRequestId,
  qtspSignatureRequestId,
  status: "CREATED",
  createdAt: new Date(),
  updatedAt: new Date()
});

export type InsertSignature = (
  signature: Signature
) => TE.TaskEither<Error, Signature>;

export type GetSignature = (
  signatureId: Signature["id"]
) => (signerId: Signer["id"]) => TE.TaskEither<Error, O.Option<Signature>>;

export type UpsertSignature = (
  signature: Signature
) => TE.TaskEither<Error, Signature>;

export type NotifySignatureReadyEvent = (
  signatureNotification: SignatureNotification
) => TE.TaskEither<Error, string>;

export const SignatureValidationParams = t.type({
  /* signatureInput contain the metadata for one or more message signatures generated from components within the HTTP message
   * Reference: https://www.ietf.org/archive/id/draft-ietf-httpbis-message-signatures-13.html#name-the-signature-input-http-fi
   */
  signatureInput: PatternString(
    "^(?:sig\\d+=[^,]*)(?:,\\s*(?:sig\\d+=[^,]*))*$"
  ),
  // This is the signature of QTSP TOS string used to demonstrate acceptance of the contract
  tosSignature: NonEmptyString,
  // This is the signature of the challenge relating to the documents to be signed and the related clauses
  challengeSignature: NonEmptyString,
  publicKey: NonEmptyString,
  // SPID/CIE saml assertion. OIDC is not supported yet.
  samlAssertionBase64: NonEmptyString
});

export type SignatureValidationParams = t.TypeOf<
  typeof SignatureValidationParams
>;
