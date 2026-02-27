import { ValidationError, validate } from "@io-sign/io-sign/validation";

import * as H from "@pagopa/handler-kit";

import { flow, identity, pipe } from "fp-ts/lib/function";

import * as E from "fp-ts/lib/Either";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as A from "fp-ts/lib/Array";

import * as t from "io-ts";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { sequenceS } from "fp-ts/lib/Apply";
import { SignatureField as SignatureFieldApiModel } from "../models/SignatureField";
import { DocumentToSign as DocumentToSignApiModel } from "../models/DocumentToSign";

import { CreateSignatureBody } from "../models/CreateSignatureBody";
import { TypeEnum as ClauseTypeEnum } from "../models/Clause";

import { DocumentToSign, SignatureField } from "../../../signature-field";

const toClauseType = (
  type: ClauseTypeEnum
): SignatureField["clause"]["type"] => {
  switch (type) {
    case ClauseTypeEnum.OPTIONAL:
      return "OPTIONAL";
    case ClauseTypeEnum.UNFAIR:
      return "UNFAIR";
    case ClauseTypeEnum.REQUIRED:
      return "REQUIRED";
  }
};

export const SignatureFieldFromApiModel = new t.Type<
  SignatureField,
  SignatureField,
  SignatureFieldApiModel
>(
  "SignatureFieldFromApiModel",
  SignatureField.is,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ clause: { title, type }, attrs }, _ctx) =>
    sequenceS(E.Apply)({
      clause: pipe(
        SignatureField.props.clause.props.title.decode(title),
        E.map((title) => ({
          title,
          type: toClauseType(type)
        }))
      ),
      attributes:
        "unique_name" in attrs
          ? pipe(
              NonEmptyString.decode(attrs.unique_name),
              E.map((uniqueName) => ({ uniqueName }))
            )
          : pipe(
              attrs,
              E.of,
              E.map((attrs) => ({
                bottomLeft: attrs.bottom_left,
                topRight: attrs.top_right,
                page: attrs.page
              }))
            )
    }),

  identity
);

export const DocumentToSignFromApiModel = new t.Type<
  DocumentToSign,
  DocumentToSign,
  DocumentToSignApiModel
>(
  "DocumentToSignFromApiModel",
  DocumentToSign.is,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ document_id, signature_fields }, _ctx) =>
    pipe(
      signature_fields,
      RA.map(SignatureFieldFromApiModel.decode),
      RA.toArray,
      A.sequence(E.Applicative),
      E.map((signatureFields) => ({
        documentId: document_id,
        signatureFields
      }))
    ),
  identity
);

export const requireDocumentsSignature = flow(
  (res: H.HttpRequest) => res.body,
  validate(CreateSignatureBody),
  E.map((body) => body.documents_to_sign),
  E.chain(
    flow(
      RA.map(DocumentToSignFromApiModel.decode),
      RA.sequence(E.Applicative),
      E.mapLeft(
        (errors) =>
          new ValidationError(
            errors.map((error) =>
              error.message !== undefined
                ? error.message
                : "Document to sign not valid!"
            )
          )
      ),
      E.chainW(validate(t.array(DocumentToSign), "Invalid documents to sign"))
    )
  )
);

export const requireCreateSignatureBody = (req: H.HttpRequest) =>
  pipe(
    req.body,
    validate(CreateSignatureBody),
    E.map((body) => ({
      email: body.email,
      signatureRequestId: body.signature_request_id
    }))
  );
