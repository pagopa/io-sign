import { SignatureRequest } from "../../../signature-request";
import {
  SignatureRequest as SignatureRequestApiModel,
  StatusEnum as SignatureRequestStatusEnum
} from "../models/SignatureRequest";
import { documentToApiModel } from "./document";
import { notificationToApiModel } from "./notification";

export const signatureRequestToApiModel = ({
  id,
  dossierId: dossier_id,
  issuerId: issuer_id,
  signerId: signer_id,
  createdAt: created_at,
  updatedAt: updated_at,
  expiresAt: expires_at,
  documents,
  ...extra
}: SignatureRequest): SignatureRequestApiModel => {
  const commonFields = {
    id,
    dossier_id,
    signer_id,
    issuer_id,
    created_at,
    updated_at,
    expires_at,
    documents: documents.map(documentToApiModel)
  };
  switch (extra.status) {
    case "DRAFT": {
      return {
        ...commonFields,
        status: SignatureRequestStatusEnum.DRAFT
      };
    }
    case "READY": {
      return {
        ...commonFields,
        status: SignatureRequestStatusEnum.READY
      };
    }
    case "WAIT_FOR_SIGNATURE": {
      return {
        ...commonFields,
        status: SignatureRequestStatusEnum.WAIT_FOR_SIGNATURE,
        notification: notificationToApiModel(extra.notification)
      };
    }
    case "WAIT_FOR_QTSP": {
      return {
        ...commonFields,
        status: SignatureRequestStatusEnum.WAIT_FOR_QTSP,
        notification: notificationToApiModel(extra.notification)
      };
    }
    case "REJECTED": {
      return {
        ...commonFields,
        status: SignatureRequestStatusEnum.REJECTED,
        notification: notificationToApiModel(extra.notification),
        rejected_at: extra.rejectedAt,
        reject_reason: extra.rejectReason
      };
    }
    case "SIGNED": {
      return {
        ...commonFields,
        notification: notificationToApiModel(extra.notification),
        status: SignatureRequestStatusEnum.SIGNED,
        signed_at: extra.signedAt
      };
    }
    case "CANCELLED": {
      return {
        ...commonFields,
        status: SignatureRequestStatusEnum.CANCELLED,
        cancelled_at: extra.cancelledAt
      };
    }
  }
};
