import {
  SignatureRequestToBeSigned,
  SignatureRequestRejected,
  SignatureRequestSigned,
  SignatureRequestWaitForQtsp,
} from "@io-sign/io-sign/signature-request";

import { Id } from "@io-sign/io-sign/id";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";

import * as t from "io-ts";
import { pipe } from "fp-ts/lib/function";
import { ActionNotAllowedError } from "@io-sign/io-sign/error";

export const SignatureRequest = t.union([
  SignatureRequestToBeSigned,
  SignatureRequestRejected,
  SignatureRequestWaitForQtsp,
  SignatureRequestSigned,
]);

export type SignatureRequest = t.TypeOf<typeof SignatureRequest>;

export type GetSignatureRequest = (
  id: Id
) => (signerId: Id) => TE.TaskEither<Error, O.Option<SignatureRequest>>;

export type InsertSignatureRequest = (
  request: SignatureRequest
) => TE.TaskEither<Error, SignatureRequest>;

export type UpsertSignatureRequest = (
  request: SignatureRequest
) => TE.TaskEither<Error, SignatureRequest>;

export type NotifySignatureRequestWaitForSignatureEvent = (
  requestToBeSigned: SignatureRequestToBeSigned
) => TE.TaskEither<Error, string>;

export type NotifySignatureRequestSignedEvent = (
  requestSigned: SignatureRequestSigned
) => TE.TaskEither<Error, string>;

export type NotifySignatureRequestRejectedEvent = (
  requestRejected: SignatureRequestRejected
) => TE.TaskEither<Error, string>;

type Action_MARK_AS_SIGNED = {
  name: "MARK_AS_SIGNED";
};

type Action_MARK_AS_REJECTED = {
  name: "MARK_AS_REJECTED";
  payload: {
    reason: string;
  };
};

type Action_MARK_AS_WAIT_FOR_QTSP = {
  name: "MARK_AS_WAIT_FOR_QTSP";
};

type SignatureRequestAction =
  | Action_MARK_AS_SIGNED
  | Action_MARK_AS_REJECTED
  | Action_MARK_AS_WAIT_FOR_QTSP;

const dispatch =
  (action: SignatureRequestAction) =>
  (request: SignatureRequest): E.Either<Error, SignatureRequest> => {
    switch (request.status) {
      case "WAIT_FOR_SIGNATURE":
        return pipe(request, onWaitForSignatureStatus(action));
      case "WAIT_FOR_QTSP":
        return pipe(request, onWaitForQtspStatus(action));
      case "REJECTED":
        return pipe(request, onRejectedStatus(action));
      default:
        return E.left(
          new ActionNotAllowedError(
            `${action.name} is prohibited because the signature request has already been signed`
          )
        );
    }
  };

const onWaitForSignatureStatus =
  (action: SignatureRequestAction) =>
  (
    request: SignatureRequestToBeSigned
  ): E.Either<
    Error,
    SignatureRequestWaitForQtsp | SignatureRequestRejected
  > => {
    switch (action.name) {
      case "MARK_AS_WAIT_FOR_QTSP":
        return E.right({
          ...request,
          updatedAt: new Date(),
          status: "WAIT_FOR_QTSP",
        });
      case "MARK_AS_REJECTED":
        return E.right({
          ...request,
          status: "REJECTED",
          updatedAt: new Date(),
          rejectedAt: new Date(),
          rejectReason: action.payload.reason,
        });
      default:
        return E.left(
          new ActionNotAllowedError(
            `${action.name} is prohibited if the signature request is in WAIT_FOR_SIGNATURE status`
          )
        );
    }
  };

const onRejectedStatus =
  (action: SignatureRequestAction) =>
  (
    request: SignatureRequestRejected
  ): E.Either<Error, SignatureRequestWaitForQtsp> => {
    // eslint-disable-next-line sonarjs/no-small-switch
    switch (action.name) {
      case "MARK_AS_WAIT_FOR_QTSP":
        return E.right({
          ...request,
          updatedAt: new Date(),
          status: "WAIT_FOR_QTSP",
        });
      default:
        return E.left(
          new ActionNotAllowedError(
            `${action.name} is prohibited if the signature request is in REJECTED status`
          )
        );
    }
  };

const onWaitForQtspStatus =
  (action: SignatureRequestAction) =>
  (
    request: SignatureRequestWaitForQtsp
  ): E.Either<Error, SignatureRequestSigned | SignatureRequestRejected> => {
    switch (action.name) {
      case "MARK_AS_SIGNED":
        return E.right({
          ...request,
          updatedAt: new Date(),
          status: "SIGNED",
          signedAt: new Date(),
        });
      case "MARK_AS_REJECTED":
        return E.right({
          ...request,
          status: "REJECTED",
          updatedAt: new Date(),
          rejectedAt: new Date(),
          rejectReason: action.payload.reason,
        });
      default:
        return E.left(
          new ActionNotAllowedError(
            `${action.name} is prohibited if the signature request is in WAIT_FOR_QTSP status`
          )
        );
    }
  };

export const markAsWaitForQtsp = dispatch({ name: "MARK_AS_WAIT_FOR_QTSP" });
export const markAsSigned = dispatch({ name: "MARK_AS_SIGNED" });
export const markAsRejected = (reason: string) =>
  dispatch({
    name: "MARK_AS_REJECTED",
    payload: { reason },
  });

export const canBeWaitForQtsp = (request: SignatureRequest) =>
  pipe(request, dispatch({ name: "MARK_AS_WAIT_FOR_QTSP" }), E.isRight);
