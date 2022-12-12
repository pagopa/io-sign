import {
  SignatureRequestToBeSigned,
  SignatureRequestRejected,
  SignatureRequestSigned,
} from "@io-sign/io-sign/signature-request";

import { Id } from "@io-sign/io-sign/id";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";

import * as t from "io-ts";

export const SignatureRequest = t.union([
  SignatureRequestToBeSigned,
  SignatureRequestRejected,
  SignatureRequestSigned,
]);

export type SignatureRequest = t.TypeOf<typeof SignatureRequest>;

export type GetSignatureRequest = (
  id: Id
) => (signerId: Id) => TE.TaskEither<Error, O.Option<SignatureRequest>>;

export type InsertSignatureRequest = (
  request: SignatureRequest
) => TE.TaskEither<Error, SignatureRequest>;

export type NotifySignatureRequestWaitForSignatureEvent = (
  requestToBeSigned: SignatureRequestToBeSigned
) => TE.TaskEither<Error, string>;
