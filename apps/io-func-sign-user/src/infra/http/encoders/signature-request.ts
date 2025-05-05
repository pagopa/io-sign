import { SignatureRequestSigned } from "@io-sign/io-sign/signature-request";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as A from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";
import * as S from "fp-ts/lib/string";
import * as E from "io-ts/lib/Encoder";

import { SignatureRequest } from "../../../signature-request";
import { IssuerEnvironmentEnum } from "../models/IssuerEnvironment";
import { SignatureRequestDetailView as SignatureRequestApiModel } from "../models/SignatureRequestDetailView";
import { SignatureRequestListView } from "../models/SignatureRequestListView";
import { SignatureRequestStatusEnum } from "../models/SignatureRequestStatus";
import { ThirdPartyMessage as ThirdPartyMessageApiModel } from "../models/ThirdPartyMessage";
import { DocumentReadyToDetailView } from "./document";

const addPdfExtension = (fileName: NonEmptyString) =>
  pipe(fileName, S.endsWith(".pdf"))
    ? fileName
    : (`${fileName}.pdf` as NonEmptyString);

export const SignatureRequestToApiModel: E.Encoder<
  SignatureRequestApiModel,
  SignatureRequest
> = {
  encode: ({
    id,
    signerId: signer_id,
    dossierId: dossier_id,
    dossierTitle: dossier_title,
    createdAt: created_at,
    updatedAt: updated_at,
    expiresAt: expires_at,
    issuerEmail: email,
    issuerDescription: description,
    issuerEnvironment: environment,
    documents,
    ...extra
  }) => {
    const commonFields = {
      id,
      signer_id,
      dossier_id,
      dossier_title,
      created_at,
      updated_at,
      expires_at,
      documents: documents.map(DocumentReadyToDetailView.encode),
      issuer: {
        email,
        description,
        environment:
          environment === "TEST"
            ? IssuerEnvironmentEnum.TEST
            : IssuerEnvironmentEnum.DEFAULT
      }
    };
    switch (extra.status) {
      case "WAIT_FOR_SIGNATURE": {
        return {
          ...commonFields,
          status: SignatureRequestStatusEnum.WAIT_FOR_SIGNATURE,
          qr_code_url: extra.qrCodeUrl
        };
      }
      case "WAIT_FOR_QTSP": {
        return {
          ...commonFields,
          status: SignatureRequestStatusEnum.WAIT_FOR_QTSP,
          qr_code_url: extra.qrCodeUrl
        };
      }
      case "REJECTED": {
        return {
          ...commonFields,
          status: SignatureRequestStatusEnum.REJECTED,
          reject_at: extra.rejectedAt,
          reject_reason: extra.rejectReason
        };
      }
      case "SIGNED": {
        return {
          ...commonFields,
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

const toSignatureRequestStatusEnum = (
  status: SignatureRequest["status"]
): SignatureRequestStatusEnum => {
  switch (status) {
    case "REJECTED":
      return SignatureRequestStatusEnum.REJECTED;
    case "SIGNED":
      return SignatureRequestStatusEnum.SIGNED;
    case "WAIT_FOR_QTSP":
      return SignatureRequestStatusEnum.WAIT_FOR_QTSP;
    case "WAIT_FOR_SIGNATURE":
      return SignatureRequestStatusEnum.WAIT_FOR_SIGNATURE;
    case "CANCELLED":
      return SignatureRequestStatusEnum.CANCELLED;
  }
};

export const SignatureRequestToListView: E.Encoder<
  SignatureRequestListView,
  SignatureRequest
> = {
  encode: ({
    id,
    signerId: signer_id,
    dossierId: dossier_id,
    dossierTitle: dossier_title,
    status,
    createdAt: created_at,
    updatedAt: updated_at,
    expiresAt: expires_at
  }) => ({
    id,
    signer_id,
    dossier_id,
    dossier_title,
    status: toSignatureRequestStatusEnum(status),
    created_at,
    updated_at,
    expires_at
  })
};

export const SignatureRequestToThirdPartyMessage: E.Encoder<
  ThirdPartyMessageApiModel,
  SignatureRequestSigned
> = {
  encode: ({ documents }) => ({
    attachments: pipe(
      documents,
      A.map((document) => ({
        id: document.id,
        content_type: "application/pdf" as NonEmptyString,
        name: addPdfExtension(document.metadata.title),
        url: document.id
      }))
    )
  })
};
