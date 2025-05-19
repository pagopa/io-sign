import * as t from "io-ts";
import * as TE from "fp-ts/TaskEither";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";

import {
  SignatureRequestCancelled,
  SignatureRequestDraft,
  SignatureRequestId,
  SignatureRequestReady,
  SignatureRequestRejected,
  SignatureRequestSigned,
  SignatureRequestToBeSigned,
  SignatureRequestWaitForQtsp
} from "@io-sign/io-sign/signature-request";

import { Signer } from "@io-sign/io-sign/signer";
import { Issuer } from "@io-sign/io-sign/issuer";

import { EntityNotFoundError } from "@io-sign/io-sign/error";

export const SignatureRequest = t.union([
  SignatureRequestDraft,
  SignatureRequestReady,
  SignatureRequestToBeSigned,
  SignatureRequestWaitForQtsp,
  SignatureRequestSigned,
  SignatureRequestRejected,
  SignatureRequestCancelled
]);

export type SignatureRequest = t.TypeOf<typeof SignatureRequest>;

export type SignatureRequestRepository = {
  getByIssuerId: (
    id: SignatureRequestId,
    issuerId: Issuer["id"]
  ) => TE.TaskEither<Error, O.Option<SignatureRequest>>;
  getBySignerId: (
    id: SignatureRequestId,
    signerId: Signer["id"]
  ) => TE.TaskEither<Error, O.Option<SignatureRequest>>;
};

export const GetSignatureRequestByIdPayload = t.intersection([
  t.type({
    id: SignatureRequestId
  }),
  t.union([
    t.type({
      issuerId: Issuer.props.id
    }),
    t.type({
      signerId: Signer.props.id
    })
  ])
]);

export type GetSignatureRequestByIdPayload = t.TypeOf<
  typeof GetSignatureRequestByIdPayload
>;

type GetSignatureRequestByIdEnvironment = {
  signatureRequestRepository: SignatureRequestRepository;
};

export const getSignatureRequestById =
  (
    p: GetSignatureRequestByIdPayload
  ): RTE.ReaderTaskEither<
    GetSignatureRequestByIdEnvironment,
    Error,
    SignatureRequest
  > =>
  ({ signatureRequestRepository: repo }) =>
    pipe(
      "issuerId" in p
        ? repo.getByIssuerId(p.id, p.issuerId)
        : repo.getBySignerId(p.id, p.signerId),
      TE.chain(
        TE.fromOption(
          () =>
            new EntityNotFoundError(
              "The specified Signature Request was not found"
            )
        )
      )
    );
