import { Id, id as newId } from "@io-sign/io-sign/id";

import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";

import * as t from "io-ts";

import { Signer } from "@io-sign/io-sign/signer";

import { flow, pipe } from "fp-ts/lib/function";
import { addDays, isBefore } from "date-fns/fp";

import { ActionNotAllowedError } from "@io-sign/io-sign/error";

import {
  Document,
  startValidation,
  markAsReady as setReadyStatus,
  markAsRejected as setRejectedStatus,
  DocumentReady,
  DocumentMetadata,
} from "@io-sign/io-sign/document";

import { EntityNotFoundError } from "@io-sign/io-sign/error";

import { findFirst, findIndex, updateAt } from "fp-ts/lib/Array";
import {
  SignatureRequestReady,
  SignatureRequestToBeSigned,
  SignatureRequestRejected,
  SignatureRequestSigned,
  makeSignatureRequestVariant,
} from "@io-sign/io-sign/signature-request";

import { Dossier } from "./dossier";

export const SignatureRequestDraft = makeSignatureRequestVariant(
  "DRAFT",
  t.type({
    documents: t.array(Document),
  })
);

export type SignatureRequestDraft = t.TypeOf<typeof SignatureRequestDraft>;

export const SignatureRequest = t.union([
  SignatureRequestDraft,
  SignatureRequestReady,
  SignatureRequestToBeSigned,
  SignatureRequestRejected,
  SignatureRequestSigned,
]);

export type SignatureRequest = t.TypeOf<typeof SignatureRequest>;

export const defaultExpiryDate = () => pipe(new Date(), addDays(90));

export const newSignatureRequest = (
  dossier: Dossier,
  signer: Signer
): SignatureRequest => ({
  id: newId(),
  issuerId: dossier.issuerId,
  signerId: signer.id,
  dossierId: dossier.id,
  status: "DRAFT",
  createdAt: new Date(),
  updatedAt: new Date(),
  expiresAt: defaultExpiryDate(),
  documents: dossier.documentsMetadata.map((metadata) => ({
    id: newId(),
    metadata,
    status: "WAIT_FOR_UPLOAD",
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
});

class InvalidExpiryDateError extends Error {
  name = "InvalidExpireDateError";
  constructor() {
    super("Invalid expire date.");
  }
}

const documentNotFoundError = new EntityNotFoundError(
  "The specified document does not exists."
);

const isExpiryDateValid = (expiryDate: Date) => (request: SignatureRequest) =>
  pipe(request.createdAt, isBefore(expiryDate));

export const withExpiryDate =
  (expiryDate: Date) => (request: SignatureRequest) =>
    pipe(
      E.right(request),
      E.filterOrElse(
        isExpiryDateValid(expiryDate),
        () => new InvalidExpiryDateError()
      ),
      E.map((request) => ({
        ...request,
        expiresAt: expiryDate,
      }))
    );

export const getDocument = (id: Document["id"]) =>
  flow(
    (request: SignatureRequest) => request.documents,
    findFirst((document: Document) => document.id === id)
  );

export const replaceDocument =
  (id: Document["id"], updated: Document) => (request: SignatureRequestDraft) =>
    pipe(
      request.documents,
      findIndex((document: Document) => document.id === id),
      O.chain((index) => pipe(request.documents, updateAt(index, updated))),
      O.map((documents) => ({ ...request, documents }))
    );

export const canBeMarkedAsReady = (
  request: SignatureRequest
): request is SignatureRequest & {
  documents: DocumentReady[];
} =>
  request.status === "DRAFT" &&
  request.documents.every((document) => document.status === "READY");

type Action_MARK_AS_READY = {
  name: "MARK_AS_READY";
};

type Action_MARK_AS_WAIT_FOR_SIGNATURE = {
  name: "MARK_AS_WAIT_FOR_SIGNATURE";
  qrCodeUrl: string;
};

type Action_MARK_AS_SIGNED = {
  name: "MARK_AS_SIGNED";
};

type Action_START_DOCUMENT_VALIDATION = {
  name: "START_DOCUMENT_VALIDATION";
  payload: {
    documentId: Document["id"];
  };
};

type Action_MARK_DOCUMENT_AS_READY = {
  name: "MARK_DOCUMENT_AS_READY";
  payload: {
    documentId: Document["id"];
    url: string;
    pages: DocumentMetadata["pages"];
  };
};

type Action_MARK_DOCUMENT_AS_REJECTED = {
  name: "MARK_DOCUMENT_AS_REJECTED";
  payload: {
    documentId: Document["id"];
    reason: string;
  };
};

type SignatureRequestAction =
  | Action_MARK_AS_READY
  | Action_MARK_AS_WAIT_FOR_SIGNATURE
  | Action_MARK_AS_SIGNED
  | Action_START_DOCUMENT_VALIDATION
  | Action_MARK_DOCUMENT_AS_READY
  | Action_MARK_DOCUMENT_AS_REJECTED;

const dispatch =
  (action: SignatureRequestAction) =>
  (request: SignatureRequest): E.Either<Error, SignatureRequest> => {
    switch (request.status) {
      case "DRAFT":
        return pipe(request, onDraftStatus(action));
      case "READY":
        return pipe(request, onReadyStatus(action));
      case "WAIT_FOR_SIGNATURE":
        return pipe(request, onWaitForSignatureStatus(action));
      case "SIGNED":
        return E.left(
          new ActionNotAllowedError(
            `${action.name} is prohibited because the signature request has already been signed`
          )
        );
      default:
        // TODO: maybe we can use a different error type
        return E.left(new ActionNotAllowedError("Invalid status"));
    }
  };

// TODO: REMOVE DUPLICATE CODE, extract utilities
const onDraftStatus =
  (action: SignatureRequestAction) =>
  (
    request: SignatureRequestDraft
  ): E.Either<Error, SignatureRequestDraft | SignatureRequestReady> => {
    switch (action.name) {
      case "MARK_AS_READY":
        if (canBeMarkedAsReady(request)) {
          return E.right({
            ...request,
            status: "READY",
          });
        }
        return E.left(
          new ActionNotAllowedError(
            `${action.name} is not possible unless all documents are READY`
          )
        );
      case "START_DOCUMENT_VALIDATION":
        return pipe(
          request,
          getDocument(action.payload.documentId),
          E.fromOption(() => documentNotFoundError),
          E.chain(startValidation),
          E.map((updated) =>
            replaceDocument(action.payload.documentId, updated)(request)
          ),
          E.chain(
            E.fromOption(() => new Error("Unable to start the validation"))
          )
        );
      case "MARK_DOCUMENT_AS_READY":
        return pipe(
          request,
          getDocument(action.payload.documentId),
          E.fromOption(() => documentNotFoundError),
          E.chain(setReadyStatus(action.payload.url, action.payload.pages)),
          E.map((updated) =>
            replaceDocument(action.payload.documentId, updated)(request)
          ),
          E.chain(
            E.fromOption(
              () => new Error("Unable to mark the document as READY")
            )
          )
        );
      case "MARK_DOCUMENT_AS_REJECTED":
        return pipe(
          request,
          getDocument(action.payload.documentId),
          E.fromOption(() => documentNotFoundError),
          E.chain(setRejectedStatus(action.payload.reason)),
          E.map((updated) =>
            replaceDocument(action.payload.documentId, updated)(request)
          ),
          E.chain(
            E.fromOption(
              () => new Error("Unable to mark the document as REJECTED")
            )
          )
        );
      default:
        return E.left(
          new ActionNotAllowedError(
            `${action.name} is prohibited if the signature request is in DRAFT status`
          )
        );
    }
  };

const onReadyStatus =
  (action: SignatureRequestAction) =>
  (
    request: SignatureRequestReady
  ): E.Either<Error, SignatureRequestToBeSigned> => {
    switch (action.name) {
      case "MARK_AS_READY":
        return E.left(
          new ActionNotAllowedError(
            "Signature Request is already in READY status"
          )
        );
      case "MARK_AS_WAIT_FOR_SIGNATURE":
        return E.right({
          ...request,
          status: "WAIT_FOR_SIGNATURE",
          // TODO: [SFEQS-946] make the QR Code dynamic
          qrCodeUrl: "https://place-holder.com/qr-code",
        });
      default:
        return E.left(
          new ActionNotAllowedError(
            `${action.name} is prohibited if the signature request is in READY status`
          )
        );
    }
  };

const onWaitForSignatureStatus =
  (action: SignatureRequestAction) =>
  (
    request: SignatureRequestToBeSigned
  ): E.Either<Error, SignatureRequestSigned> => {
    if (action.name === "MARK_AS_SIGNED") {
      return E.right({
        ...request,
        status: "SIGNED",
        signedAt: new Date(),
      });
    }
    return E.left(
      new ActionNotAllowedError(
        `${action.name} is prohibited if the signature request is in WAIT_FOR_SIGNATURE status`
      )
    );
  };

export const markAsReady = (
  request: SignatureRequest
): E.Either<Error, SignatureRequestReady & { dossierId: Dossier["id"] }> =>
  pipe(
    dispatch({ name: "MARK_AS_READY" })(request),
    E.filterOrElse(
      (
        request
      ): request is SignatureRequestReady & { dossierId: Dossier["id"] } =>
        request.status === "READY",
      () => new Error("Unable to mark the Signature Request as READY")
    )
  );

export const markAsWaitForSignature = (qrCodeUrl: string) =>
  dispatch({
    name: "MARK_AS_WAIT_FOR_SIGNATURE",
    qrCodeUrl,
  });

export const markAsSigned = dispatch({ name: "MARK_AS_SIGNED" });

export const startValidationOnDocument = (documentId: Document["id"]) =>
  dispatch({ name: "START_DOCUMENT_VALIDATION", payload: { documentId } });

export const markDocumentAsReady = (
  documentId: Document["id"],
  url: string,
  pages: DocumentMetadata["pages"]
) =>
  dispatch({
    name: "MARK_DOCUMENT_AS_READY",
    payload: { documentId, url, pages },
  });

export const markDocumentAsRejected = (
  documentId: Document["id"],
  reason: string
) =>
  dispatch({
    name: "MARK_DOCUMENT_AS_REJECTED",
    payload: { documentId, reason },
  });

export type GetSignatureRequest = (
  id: Id
) => (issuerId: Id) => TE.TaskEither<Error, O.Option<SignatureRequest>>;

export type InsertSignatureRequest = (
  request: SignatureRequest
) => TE.TaskEither<Error, SignatureRequest>;

export type UpsertSignatureRequest = (
  request: SignatureRequest
) => TE.TaskEither<Error, SignatureRequest>;

export type NotifySignatureRequestReadyEvent = (
  requestReady: SignatureRequestReady
) => TE.TaskEither<Error, string>;
