import { body } from "@pagopa/handler-kit/lib/http";
import { validate } from "@pagopa/handler-kit/lib/validation";

import { flow, pipe } from "fp-ts/lib/function";

import * as E from "fp-ts/lib/Either";

import * as tx from "io-ts-types";

import * as t from "io-ts";
import { DocumentMetadata } from "@internal/io-sign/document";

import { SignatureField } from "@internal/io-sign/document";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

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
  ({ clause: { title, type }, attrs }, ctx) => {
    const clause = {
      title,
      type: toClauseType(type),
    };
    if ("unique_name" in attrs) {
      return pipe(
        NonEmptyString.decode(attrs.unique_name),
        E.map((uniqueName) => ({ uniqueName })),
        E.map((attributes) => ({ clause, attributes })),
        E.chain(t.success),
        E.alt(() =>
          t.failure(attrs.unique_name, ctx, "uniqueName should not be empty")
        )
      );
    }
    return t.success({
      clause,
      attributes: attrs,
    });
  },
  SignatureFieldToApiModel.encode
);

export const DocumentMetadataFromApiModel = new t.Type<
  DocumentMetadata,
  DocumentMetadataApiModel,
  DocumentMetadataApiModel
>(
  "DocumentMetadataFromApiModel",
  DocumentMetadata.is,
  ({ title, signature_fields }, ctx) =>
    pipe(
      signature_fields,
      t.array(SignatureFieldApiModel.pipe(SignatureFieldFromApiModel)).decode,
      E.map((signatureFields) => ({ title, signatureFields })),
      E.chain(t.success),
      E.alt(() => t.failure(signature_fields, ctx, "invalid signature_fields"))
    ),
  DocumentMetadataToApiModel.encode
);

export const requireDocumentsMetadata = flow(
  body(CreateDossierBody),
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
