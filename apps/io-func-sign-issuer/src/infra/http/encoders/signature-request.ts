import * as E from "io-ts/lib/Encoder";
import { SignatureRequestDetailView as SignatureRequestApiModel } from "../models/SignatureRequestDetailView";

import { SignatureRequestStatusEnum } from "../models/SignatureRequestStatus";

import { SignatureRequest } from "../../../signature-request";

import { SignatureRequestList } from "../models/SignatureRequestList";
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
      documents: documents.map(DocumentToApiModel.encode)
    };
    switch (extra.status) {
      case "DRAFT": {
        return {
          ...commonFields,
          status: SignatureRequestStatusEnum.DRAFT
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
          qr_code_url: extra.qrCodeUrl
        };
      }
      case "READY": {
        return {
          ...commonFields,
          status: SignatureRequestStatusEnum.READY
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
          reject_reason: extra.rejectReason
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
  }
};

export const SignatureRequestToListApiModel: E.Encoder<
  SignatureRequestList,
  {
    items: readonly SignatureRequest[];
    continuationToken?: string;
  }
> = {
  encode: ({ items, continuationToken }): SignatureRequestList => ({
    items: items
      .map(SignatureRequestToApiModel.encode)
      .map(
        ({
          id,
          signer_id,
          dossier_id,
          status,
          created_at,
          updated_at,
          expires_at
        }) => ({
          id,
          signer_id,
          dossier_id,
          status,
          created_at,
          updated_at,
          expires_at
        })
      ),
    continuation_token: continuationToken
  })
};
