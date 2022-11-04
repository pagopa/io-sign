import * as t from "io-ts";

import * as E from "fp-ts/lib/Either";

import {
  WithinRangeString,
  NonEmptyString,
} from "@pagopa/ts-commons/lib/strings";

import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";

import { NonNegativeNumber } from "@pagopa/ts-commons/lib/numbers";

import { id, Id } from "./id";
import { pipe } from "fp-ts/lib/function";

const ClauseType = t.keyof({
  REQUIRED: null,
  UNFAIR: null,
  OPTIONAL: null,
});

const ClauseTitle = WithinRangeString(10, 80);

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

const DocumentToBeUploaded = t.type({
  status: t.literal("WAIT_FOR_UPLOAD"),
});

const DocumentToBeValidated = t.type({
  status: t.literal("WAIT_FOR_VALIDATION"),
  uploadedAt: IsoDateFromString,
});

const DocumentUploaded = t.type({
  status: t.literal("READY"),
  uploadedAt: IsoDateFromString,
  url: t.string,
});

const DocumentRejected = t.type({
  status: t.literal("REJECTED"),
  uploadedAt: IsoDateFromString,
  rejectedAt: IsoDateFromString,
  rejectReason: t.string,
});

export const Document = t.intersection([
  t.type({
    id: Id,
    metadata: DocumentMetadata,
    createdAt: IsoDateFromString,
    updatedAt: IsoDateFromString,
  }),
  t.union([
    DocumentToBeUploaded,
    DocumentToBeValidated,
    DocumentUploaded,
    DocumentRejected,
  ]),
]);

export type Document = t.TypeOf<typeof Document>;

export const newDocument = (metadata: DocumentMetadata): Document => ({
  id: id(),
  status: "WAIT_FOR_UPLOAD",
  metadata,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export class ActionNotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionNotAllowedError";
  }
}

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
  (document: Document): E.Either<Error, Document> => {
    switch (action.name) {
      case "START_VALIDATION":
        return E.right({
          ...document,
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
  (document: Document): E.Either<Error, Document> => {
    switch (action.name) {
      case "MARK_AS_READY":
        return E.right({
          ...document,
          status: "READY",
          uploadedAt: new Date(), // TODO: this date is wrong
          url: action.payload.url,
        });
      case "MARK_AS_REJECTED": {
        return E.right({
          ...document,
          status: "REJECTED",
          uploadedAt: new Date(), // TODO: this date is wrong
          rejectedAt: new Date(),
          rejectReason: action.payload.reason,
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
  (document: Document): E.Either<Error, Document> => {
    switch (action.name) {
      case "START_VALIDATION":
        return E.right({
          ...document,
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
