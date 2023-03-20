import * as E from "io-ts/lib/Encoder";

import { SignatureRequestSigned } from "@io-sign/io-sign/signature-request";
import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/lib/Array";
import * as S from "fp-ts/lib/string";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { SignatureRequestDetailView as SignatureRequestApiModel } from "../models/SignatureRequestDetailView";

import { SignatureRequestStatusEnum } from "../models/SignatureRequestStatus";

import { ThirdPartyMessage as ThirdPartyMessageApiModel } from "../models/ThirdPartyMessage";

import { SignatureRequest } from "../../../signature-request";

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
      },
    };
    switch (extra.status) {
      case "WAIT_FOR_SIGNATURE": {
        return {
          ...commonFields,
          status: SignatureRequestStatusEnum.WAIT_FOR_SIGNATURE,
          qr_code_url: extra.qrCodeUrl,
        };
      }
      case "WAIT_FOR_QTSP": {
        return {
          ...commonFields,
          status: SignatureRequestStatusEnum.WAIT_FOR_QTSP,
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
        url: document.id,
      }))
    ),
  }),
};
