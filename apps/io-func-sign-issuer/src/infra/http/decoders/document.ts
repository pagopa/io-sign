import { validate } from "@io-sign/io-sign/validation";

import { HttpRequest } from "@pagopa/handler-kit/lib/http";

import { flow, pipe } from "fp-ts/lib/function";

import * as E from "fp-ts/lib/Either";

import * as tx from "io-ts-types";

import * as t from "io-ts";
import { DocumentMetadata } from "@io-sign/io-sign/document";

import { SignatureField } from "@io-sign/io-sign/document";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { sequenceS } from "fp-ts/lib/Apply";

import { SignatureField as SignatureFieldApiModel } from "../models/SignatureField";
import { DocumentMetadata as DocumentMetadataApiModel } from "../models/DocumentMetadata";

import { CreateDossierBody } from "../models/CreateDossierBody";
import { TypeEnum as ClauseTypeEnum } from "../models/Clause";
import { SignatureFieldToApiModel } from "../encoders/signature-field";
import { DocumentMetadataToApiModel } from "../encoders/document";

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
  ({ clause: { title, type }, attrs }) =>
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

export const DocumentMetadataFromApiModel = new t.Type<
  DocumentMetadata,
  DocumentMetadataApiModel,
  DocumentMetadataApiModel
>(
  "DocumentMetadataFromApiModel",
  DocumentMetadata.is,
  ({ title, signature_fields }) =>
    pipe(
      signature_fields ?? [],
      t.array(SignatureFieldApiModel.pipe(SignatureFieldFromApiModel)).decode,
      E.map((signatureFields) => ({
        title,
        signatureFields,
        pdfDocumentMetadata: { pages: [], formFields: [] },
      }))
    ),
  DocumentMetadataToApiModel.encode
);

export const requireDocumentsMetadata = flow(
  (res: HttpRequest) => res.body,
  validate(CreateDossierBody),
  E.map((body) => body.documents_metadata),
  E.chain(
    validate(
      tx.nonEmptyArray(
        DocumentMetadataApiModel.pipe(DocumentMetadataFromApiModel)
      ),
      "Invalid document metadata"
    )
  )
);
