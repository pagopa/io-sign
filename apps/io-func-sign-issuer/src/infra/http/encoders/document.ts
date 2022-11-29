import * as E from "io-ts/lib/Encoder";

import { Document, DocumentMetadata } from "@pagopa/io-sign/document";
import { DocumentDetailView as DocumentApiModel } from "../models/DocumentDetailView";
import { DocumentMetadata as DocumentMetadataApiModel } from "../models/DocumentMetadata";

import { StatusEnum as DocumentStatusEnum } from "../models/Document";
import { SignatureFieldToApiModel } from "./signature-field";

export const DocumentMetadataToApiModel: E.Encoder<
  DocumentMetadataApiModel,
  DocumentMetadata
> = {
  encode: ({ title, signatureFields }) => ({
    title,
    signature_fields: signatureFields.map(SignatureFieldToApiModel.encode),
  }),
};

const toApiModelEnum = (status: Document["status"]): DocumentStatusEnum => {
  switch (status) {
    case "READY":
      return DocumentStatusEnum.READY;
    case "REJECTED":
      return DocumentStatusEnum.REJECTED;
    case "WAIT_FOR_UPLOAD":
      return DocumentStatusEnum.WAIT_FOR_UPLOAD;
    case "WAIT_FOR_VALIDATION":
      return DocumentStatusEnum.WAIT_FOR_VALIDATION;
  }
};

export const DocumentToApiModel: E.Encoder<DocumentApiModel, Document> = {
  encode: ({
    id,
    metadata,
    createdAt: created_at,
    updatedAt: updated_at,
    ...additionals
  }) => {
    const commonFields = {
      id,
      status: toApiModelEnum(additionals.status),
      metadata: DocumentMetadataToApiModel.encode(metadata),
      created_at,
      updated_at,
    };
    switch (additionals.status) {
      case "WAIT_FOR_VALIDATION": {
        return {
          ...commonFields,
          uploaded_at: additionals.uploadedAt,
        };
      }
      case "READY": {
        return {
          ...commonFields,
          uploaded_at: additionals.uploadedAt,
          url: additionals.url,
        };
      }
      case "REJECTED": {
        return {
          ...commonFields,
          uploaded_at: additionals.uploadedAt,
          rejected_at: additionals.rejectedAt,
          reject_reason: additionals.rejectReason,
        };
      }
      default: {
        return commonFields;
      }
    }
  },
};
