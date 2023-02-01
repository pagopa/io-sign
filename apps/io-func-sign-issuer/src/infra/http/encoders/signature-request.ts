import * as E from "io-ts/lib/Encoder";
import {
  SignatureRequestDetailView as SignatureRequestApiModel,
  StatusEnum as SignatureRequestStatusEnum,
} from "../models/SignatureRequestDetailView";

import { SignatureRequest } from "../../../signature-request";

import { DocumentToApiModel } from "./document";
import { NotificationToApiModel } from "./notification";

export const SignatureRequestToApiModel: E.Encoder<
  SignatureRequestApiModel,
  SignatureRequest
> = {
  encode: ({
    id,
    dossierId: dossier_id,
    signerId: signer_id,
    createdAt: created_at,
    updatedAt: updated_at,
    expiresAt: expires_at,
    documents,
    ...extra
  }) => {
    const commonFields = {
      id,
      dossier_id,
      signer_id,
      created_at,
      updated_at,
      expires_at,
      documents: documents.map(DocumentToApiModel.encode),
    };
    switch (extra.status) {
      case "DRAFT": {
        return {
          ...commonFields,
          status: SignatureRequestStatusEnum.DRAFT,
        };
      }
      case "WAIT_FOR_SIGNATURE": {
        return {
          ...commonFields,
          status: SignatureRequestStatusEnum.WAIT_FOR_SIGNATURE,
          notification:
            extra.notification !== undefined
              ? NotificationToApiModel.encode(extra.notification)
              : undefined,
          qr_code_url: extra.qrCodeUrl,
        };
      }
      case "READY": {
        return {
          ...commonFields,
          status: SignatureRequestStatusEnum.READY,
        };
      }
      case "REJECTED": {
        return {
          ...commonFields,
          notification:
            extra.notification !== undefined
              ? NotificationToApiModel.encode(extra.notification)
              : undefined,
          status: SignatureRequestStatusEnum.REJECTED,
          rejected_at: extra.rejectedAt,
          reject_reason: extra.rejectReason,
        };
      }
      case "SIGNED": {
        return {
          ...commonFields,
          notification:
            extra.notification !== undefined
              ? NotificationToApiModel.encode(extra.notification)
              : undefined,
          status: SignatureRequestStatusEnum.SIGNED,
          signed_at: extra.signedAt,
        };
      }
    }
  },
};
