import * as t from "io-ts";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";

import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";

import { Id, id as newId } from "@io-sign/io-sign/id";

import { Signer } from "@io-sign/io-sign/signer";

const SignatureStatusV = t.keyof({
  CREATED: null,
  READY: null,
  WAITING: null,
  COMPLETED: null,
  FAILED: null,
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
    updatedAt: IsoDateFromString,
  }),
  t.partial({
    rejectedReason: t.string,
  }),
]);

export type Signature = t.TypeOf<typeof Signature>;

export const SignatureNotification = t.type({
  signatureId: Id,
  signerId: Signer.props.id,
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
  updatedAt: new Date(),
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
