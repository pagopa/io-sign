import * as t from "io-ts";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";

import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";

import { Id, id as newId } from "@io-sign/io-sign/id";

import { Signer } from "@io-sign/io-sign/signer";

enum SignatureStatus {
  CREATED = "CREATED",
  READY = "READY",
  WAITING = "WAITING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

const SignatureStatusV = t.keyof({
  [SignatureStatus.CREATED]: null,
  [SignatureStatus.READY]: null,
  [SignatureStatus.WAITING]: null,
  [SignatureStatus.COMPLETED]: null,
  [SignatureStatus.FAILED]: null,
});

export const Signature = t.type({
  id: Id,
  signerId: Signer.props.id,
  signatureRequestId: Id,
  qtspSignatureRequestId: Id,
  status: SignatureStatusV,
  createdAt: IsoDateFromString,
  updatedAt: IsoDateFromString,
});

export type Signature = t.TypeOf<typeof Signature>;

export const newSignature = (
  signer: Signer,
  signatureRequestId: Id,
  qtspSignatureRequestId: Id
): Signature => ({
  id: newId(),
  signerId: signer.id,
  signatureRequestId,
  qtspSignatureRequestId,
  status: SignatureStatus.CREATED,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export type InsertSignature = (
  signature: Signature
) => TE.TaskEither<Error, Signature>;

export type GetSignature = (
  signatureId: Signature["id"]
) => (signerId: Signer["id"]) => TE.TaskEither<Error, O.Option<Signature>>;
