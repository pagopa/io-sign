import * as E from "io-ts/lib/Encoder";

import { QtspClausesMetadata } from "../../../qtsp";

import { QtspClausesMetadataDetailView } from "../models/QtspClausesMetadataDetailView";

export const QtspClausesMetadataToApiModel: E.Encoder<
  QtspClausesMetadataDetailView,
  QtspClausesMetadata
> = {
  encode: ({
    clauses,
    documentUrl,
    privacyUrl,
    termsAndConditionsUrl,
    privacyText,
    nonce
  }) => ({
    clauses,
    document_url: documentUrl,
    privacy_url: privacyUrl,
    terms_and_conditions_url: termsAndConditionsUrl,
    privacy_text: privacyText,
    nonce
  })
};
