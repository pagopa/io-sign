import * as E from "io-ts/lib/Encoder";
import {
  SignatureRequestDetailView as SignatureRequestApiModel,
  StatusEnum as SignatureRequestStatusEnum,
} from "../models/SignatureRequestDetailView";

import { SignatureRequest } from "../../../signature-request";

import { DocumentToApiModel } from "./document";

const toApiModelEnum = (
  type: SignatureRequest["status"]
): SignatureRequestStatusEnum => {
  switch (type) {
    case "DRAFT":
      return SignatureRequestStatusEnum.DRAFT;
    case "READY":
      return SignatureRequestStatusEnum.READY;
    case "WAIT_FOR_SIGNATURE":
      return SignatureRequestStatusEnum.WAIT_FOR_SIGNATURE;
    case "SIGNED":
      return SignatureRequestStatusEnum.SIGNED;
    case "REJECTED":
      return SignatureRequestStatusEnum.REJECTED;
  }
};

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
    ...extras
  }) => {
    const commonFields = {
      id,
      dossier_id,
      signer_id,
      status: toApiModelEnum(extras.status),
      created_at,
      updated_at,
      expires_at,
      documents: documents.map(DocumentToApiModel.encode),
      // here we have to handle the dynamic QR Code
      qr_code_url: [
        SignatureRequestStatusEnum.DRAFT,
        SignatureRequestStatusEnum.READY,
      ].includes(toApiModelEnum(extras.status))
        ? undefined
        : "https://place-holder.com/qr-code",
    };
    switch (extras.status) {
      case "SIGNED": {
        return {
          ...commonFields,
          signed_at: extras.signedAt,
        };
      }
      case "REJECTED": {
        return {
          ...commonFields,
          reject_reason: extras.rejectedReason,
        };
      }
      default: {
        return commonFields;
      }
    }
  },
};
