import * as E from "io-ts/lib/Encoder";

import {
  SignatureRequestDetailView as SignatureRequestApiModel,
  StatusEnum as SignatureRequestStatusEnum,
} from "../models/SignatureRequestDetailView";

import { SignatureRequest } from "../../../signature-request";

import { DocumentReadyToDetailView } from "./document";

export const SignatureRequestToApiModel: E.Encoder<
  SignatureRequestApiModel,
  SignatureRequest
> = {
  encode: ({
    id,
    signerId: signer_id,
    dossierId: dossier_id,
    createdAt: created_at,
    updatedAt: updated_at,
    expiresAt: expires_at,
    documents,
    ...extra
  }) => {
    const commonFields = {
      id,
      signer_id,
      dossier_id,
      created_at,
      updated_at,
      expires_at,
      documents: documents.map(DocumentReadyToDetailView.encode),
    };
    switch (extra.status) {
      case "WAIT_FOR_SIGNATURE": {
        return {
          ...commonFields,
          status: SignatureRequestStatusEnum.WAIT_FOR_SIGNATURE,
          qr_code_url: extra.qrCodeUrl,
        };
      }
      case "REJECTED": {
        return {
          ...commonFields,
          status: SignatureRequestStatusEnum.REJECTED,
          reject_at: extra.rejectedAt,
          reject_reason: extra.rejectReason,
        };
      }
      case "SIGNED": {
        return {
          ...commonFields,
          status: SignatureRequestStatusEnum.SIGNED,
          signed_at: extra.signedAt,
        };
      }
    }
  },
};
