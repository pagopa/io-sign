import * as E from "io-ts/lib/Encoder";
import { Signature } from "../../../signature";

import {
  SignatureDetailView as SignatureApiModel,
  StatusEnum as SignatureStatusEnum
} from "../models/SignatureDetailView";

const statusToApiModelEnum = (
  status: Signature["status"]
): SignatureStatusEnum => {
  switch (status) {
    case "COMPLETED":
      return SignatureStatusEnum.COMPLETED;
    case "CREATED":
      return SignatureStatusEnum.CREATED;
    case "FAILED":
      return SignatureStatusEnum.FAILED;
    case "READY":
      return SignatureStatusEnum.READY;
    case "WAITING":
      return SignatureStatusEnum.WAITING;
    default:
      return SignatureStatusEnum.FAILED;
  }
};

export const SignatureToApiModel: E.Encoder<SignatureApiModel, Signature> = {
  encode: ({
    id,
    signatureRequestId,
    qtspSignatureRequestId,
    status,
    createdAt,
    updatedAt
  }) => ({
    id,
    signature_request_id: signatureRequestId,
    qtsp_signature_request_id: qtspSignatureRequestId,
    status: statusToApiModelEnum(status),
    created_at: createdAt,
    updated_at: updatedAt
  })
};
