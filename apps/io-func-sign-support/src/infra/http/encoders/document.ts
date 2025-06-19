import { Document, DocumentMetadata } from "@io-sign/io-sign/document";

import {
  Document as DocumentApiModel,
  StatusEnum as DocumentStatusEnum
} from "../models/Document";

import { DocumentMetadata as DocumentMetadataApiModel } from "../models/DocumentMetadata";
import { signatureFieldToApiModel } from "./signature-field";

export const documentMetadataToApiModel = ({
  title,
  signatureFields
}: DocumentMetadata): DocumentMetadataApiModel => ({
  title,
  signature_fields: signatureFields.map(signatureFieldToApiModel)
});

export const documentToApiModel = ({
  id,
  metadata,
  createdAt: created_at,
  updatedAt: updated_at,
  ...extra
}: Document): DocumentApiModel => {
  const commonFields = {
    id,
    metadata: documentMetadataToApiModel(metadata),
    created_at,
    updated_at
  };
  switch (extra.status) {
    case "WAIT_FOR_VALIDATION": {
      return {
        ...commonFields,
        status: DocumentStatusEnum.WAIT_FOR_VALIDATION,
        uploaded_at: extra.uploadedAt
      };
    }
    case "READY": {
      return {
        ...commonFields,
        status: DocumentStatusEnum.READY,
        uploaded_at: extra.uploadedAt,
        url: extra.url
      };
    }
    case "REJECTED": {
      return {
        ...commonFields,
        status: DocumentStatusEnum.REJECTED,
        uploaded_at: extra.uploadedAt,
        rejected_at: extra.rejectedAt,
        reject_reason: extra.rejectReason
      };
    }
    default: {
      return {
        status: DocumentStatusEnum.WAIT_FOR_UPLOAD,
        ...commonFields
      };
    }
  }
};
