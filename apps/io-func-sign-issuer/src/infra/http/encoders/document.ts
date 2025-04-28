import { Document, DocumentMetadata } from "@io-sign/io-sign/document";
import * as E from "io-ts/lib/Encoder";

import { DocumentDetailView as DocumentApiModel } from "../models/DocumentDetailView";
import { DocumentMetadata as DocumentMetadataApiModel } from "../models/DocumentMetadata";
import { StatusEnum as ReadyStatusEnum } from "../models/DocumentReady";
import { StatusEnum as RejectedStatusEnum } from "../models/DocumentRejected";
import { StatusEnum as ToBeUploadedStatusEnum } from "../models/DocumentToBeUploaded";
import { StatusEnum as ToBeValidatedStatusEnum } from "../models/DocumentToBeValidated";
import { SignatureFieldToApiModel } from "./signature-field";

export const DocumentMetadataToApiModel: E.Encoder<
  DocumentMetadataApiModel,
  DocumentMetadata
> = {
  encode: ({ title, signatureFields }) => ({
    title,
    signature_fields: signatureFields.map(SignatureFieldToApiModel.encode)
  })
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
      metadata: DocumentMetadataToApiModel.encode(metadata),
      created_at,
      updated_at
    };
    switch (additionals.status) {
      case "WAIT_FOR_VALIDATION": {
        return {
          ...commonFields,
          status: ToBeValidatedStatusEnum.WAIT_FOR_VALIDATION,
          uploaded_at: additionals.uploadedAt
        };
      }
      case "READY": {
        return {
          ...commonFields,
          status: ReadyStatusEnum.READY,
          uploaded_at: additionals.uploadedAt,
          url: additionals.url
        };
      }
      case "REJECTED": {
        return {
          ...commonFields,
          status: RejectedStatusEnum.REJECTED,
          uploaded_at: additionals.uploadedAt,
          rejected_at: additionals.rejectedAt,
          reject_reason: additionals.rejectReason
        };
      }
      default: {
        return {
          status: ToBeUploadedStatusEnum.WAIT_FOR_UPLOAD,
          ...commonFields
        };
      }
    }
  }
};
