import { validate } from "@io-sign/io-sign/validation";

import { HttpRequest } from "@pagopa/handler-kit/lib/http";

import { flow, pipe } from "fp-ts/lib/function";

import * as E from "fp-ts/lib/Either";

import * as tx from "io-ts-types";

import * as t from "io-ts";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { sequenceS } from "fp-ts/lib/Apply";
import { SignatureField as SignatureFieldApiModel } from "../models/SignatureField";
import { DocumentToSign as DocumentToSignApiModel } from "../models/DocumentToSign";

import { CreateSignatureBody } from "../models/CreateSignatureBody";
import { TypeEnum as ClauseTypeEnum } from "../models/Clause";
import { SignatureFieldToApiModel } from "../encoders/signature-field";

import { DocumentToSign, SignatureField } from "../../../document-to-sign";
import { DocumentToSignToApiModel } from "../encoders/document-signature";

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
  SignatureFieldApiModel,
  SignatureFieldApiModel
>(
  "SignatureFieldFromApiModel",
  SignatureField.is,
  ({ clause: { title, type }, attrs }, _ctx) =>
    sequenceS(E.Apply)({
      clause: pipe(
        SignatureField.props.clause.props.title.decode(title),
        E.map((title) => ({
          title,
          type: toClauseType(type),
        }))
      ),
      attributes:
        "unique_name" in attrs
          ? pipe(
              NonEmptyString.decode(attrs.unique_name),
              E.map((uniqueName) => ({ uniqueName }))
            )
          : E.right(attrs),
    }),
  SignatureFieldToApiModel.encode
);

export const DocumentToSignFromApiModel = new t.Type<
  DocumentToSign,
  DocumentToSignApiModel,
  DocumentToSignApiModel
>(
  "DocumentToSignFromApiModel",
  DocumentToSign.is,
  ({ document_id, signature_fields }, _ctx) =>
    pipe(
      signature_fields,
      t.array(SignatureFieldApiModel.pipe(SignatureFieldFromApiModel)).decode,
      E.map((signatureFields) => ({
        documentId: document_id,
        signatureFields,
      }))
    ),
  DocumentToSignToApiModel.encode
);

export const requireDocumentsSignature = flow(
  (res: HttpRequest) => res.body,
  validate(CreateSignatureBody),
  E.map((body) => body.documents_to_sign),
  E.chain(
    validate(
      tx.nonEmptyArray(DocumentToSignApiModel.pipe(DocumentToSignFromApiModel)),
      "Invalid document to sign"
    )
  )
);
