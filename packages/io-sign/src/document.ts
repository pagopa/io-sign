/* eslint-disable sonarjs/no-small-switch */

import * as t from "io-ts";

import * as E from "fp-ts/lib/Either";

import {
  WithinRangeString,
  NonEmptyString,
} from "@pagopa/ts-commons/lib/strings";

import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";

import { ActionNotAllowedError } from "./error";

import { NonNegativeNumber } from "@pagopa/ts-commons/lib/numbers";

import { pipe } from "fp-ts/lib/function";
import { id, Id } from "./id";

const ClauseType = t.keyof({
  REQUIRED: null,
  UNFAIR: null,
  OPTIONAL: null,
});

const ClauseTitle = WithinRangeString(5, 80);

const Clause = t.type({
  title: ClauseTitle,
  type: ClauseType,
});

type Clause = t.TypeOf<typeof Clause>;

export const isRequired = (c: Clause) => c.type !== "OPTIONAL";

export const SignatureFieldAttributes = t.type({
  uniqueName: NonEmptyString,
});

export type SignatureFieldAttributes = t.TypeOf<
  typeof SignatureFieldAttributes
>;

export const SignatureFieldToBeCreatedAttributes = t.type({
  coordinates: t.type({
    x: t.number,
    y: t.number,
  }),
  page: NonNegativeNumber,
  size: t.type({
    w: NonNegativeNumber,
    h: NonNegativeNumber,
  }),
});

export type SignatureFieldToBeCreatedAttributes = t.TypeOf<
  typeof SignatureFieldToBeCreatedAttributes
>;

export const SignatureField = t.type({
  attributes: t.union([
    SignatureFieldAttributes,
    SignatureFieldToBeCreatedAttributes,
  ]),
  clause: Clause,
});

export type SignatureField = t.TypeOf<typeof SignatureField>;

export const DocumentMetadata = t.type({
  title: WithinRangeString(3, 15),
  signatureFields: t.array(SignatureField),
});

export type DocumentMetadata = t.TypeOf<typeof DocumentMetadata>;

export const DocumentId = Id;

const commonFields = {
  id: DocumentId,
  metadata: DocumentMetadata,
  createdAt: IsoDateFromString,
  updatedAt: IsoDateFromString,
};

const DocumentToBeUploaded = t.type({
  ...commonFields,
  status: t.literal("WAIT_FOR_UPLOAD"),
});

export type DocumentToBeUploaded = t.TypeOf<typeof DocumentToBeUploaded>;

const DocumentToBeValidated = t.type({
  ...commonFields,
  status: t.literal("WAIT_FOR_VALIDATION"),
  uploadedAt: IsoDateFromString,
});

export type DocumentToBeValidated = t.TypeOf<typeof DocumentToBeValidated>;

const DocumentReady = t.type({
  ...commonFields,
  status: t.literal("READY"),
  uploadedAt: IsoDateFromString,
  url: t.string,
});

export type DocumentReady = t.TypeOf<typeof DocumentReady>;

const DocumentRejected = t.type({
  ...commonFields,
  status: t.literal("REJECTED"),
  uploadedAt: IsoDateFromString,
  rejectedAt: IsoDateFromString,
  rejectReason: t.string,
});

export type DocumentRejected = t.TypeOf<typeof DocumentRejected>;

export const Document = t.union([
  DocumentToBeUploaded,
  DocumentToBeValidated,
  DocumentReady,
  DocumentRejected,
]);

export type Document = t.TypeOf<typeof Document>;

export const newDocument = (metadata: DocumentMetadata): Document => ({
  id: id(),
  status: "WAIT_FOR_UPLOAD",
  metadata,
  createdAt: new Date(),
  updatedAt: new Date(),
});

type Action_START_VALIDATION = {
  name: "START_VALIDATION";
};

type Action_MARK_AS_READY = {
  name: "MARK_AS_READY";
  payload: {
    url: string;
  };
};

type Action_MARK_AS_REJECTED = {
  name: "MARK_AS_REJECTED";
  payload: {
    reason: string;
  };
};

type DocumentAction =
  | Action_START_VALIDATION
  | Action_MARK_AS_READY
  | Action_MARK_AS_REJECTED;

const dispatch =
  (action: DocumentAction) =>
  (document: Document): E.Either<Error, Document> => {
    switch (document.status) {
      case "WAIT_FOR_UPLOAD":
      case "READY":
        return pipe(document, onWaitForUploadOrReadyStatus(action));
      case "WAIT_FOR_VALIDATION":
        return pipe(document, onWaitForValidationStatus(action));
      case "REJECTED":
        return pipe(document, onRejectedStatus(action));
      default:
        return E.left(new ActionNotAllowedError("Invalid status"));
    }
  };

const onWaitForUploadOrReadyStatus =
  (action: DocumentAction) =>
  ({
    id,
    metadata,
    createdAt,
  }: DocumentToBeUploaded | DocumentReady): E.Either<
    Error,
    DocumentToBeValidated
  > => {
    switch (action.name) {
      case "START_VALIDATION":
        return E.right({
          id,
          createdAt,
          metadata,
          status: "WAIT_FOR_VALIDATION",
          uploadedAt: new Date(),
          updatedAt: new Date(),
        });
      default:
        return E.left(
          new ActionNotAllowedError(
            "This operation is prohibited if the document is in READY and WAIT_FOR_UPLOAD status"
          )
        );
    }
  };

const onWaitForValidationStatus =
  (action: DocumentAction) =>
  (
    document: DocumentToBeValidated
  ): E.Either<Error, DocumentReady | DocumentRejected> => {
    switch (action.name) {
      case "MARK_AS_READY":
        return E.right({
          ...document,
          status: "READY",
          url: action.payload.url,
          updatedAt: new Date(),
        });
      case "MARK_AS_REJECTED": {
        return E.right({
          ...document,
          status: "REJECTED",
          rejectedAt: new Date(),
          rejectReason: action.payload.reason,
          updatedAt: new Date(),
        });
      }
      default:
        return E.left(
          new ActionNotAllowedError(
            "This operation is prohibited if the document is in WAIT_FOR_VALIDATION status"
          )
        );
    }
  };

const onRejectedStatus =
  (action: DocumentAction) =>
  ({
    id,
    createdAt,
    metadata,
  }: DocumentRejected): E.Either<Error, DocumentToBeValidated> => {
    switch (action.name) {
      case "START_VALIDATION":
        return E.right({
          id,
          createdAt,
          metadata,
          status: "WAIT_FOR_VALIDATION",
          uploadedAt: new Date(),
          updatedAt: new Date(),
        });
      default:
        return E.left(
          new ActionNotAllowedError(
            "This operation is prohibited if the document is in REJECTED status"
          )
        );
    }
  };

export const startValidation = dispatch({
  name: "START_VALIDATION",
});

export const markAsReady = (url: string) =>
  dispatch({
    name: "MARK_AS_READY",
    payload: {
      url,
    },
  });

export const markAsRejected = (reason: string) =>
  dispatch({
    name: "MARK_AS_REJECTED",
    payload: {
      reason,
    },
  });
