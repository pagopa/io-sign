import * as E from "io-ts/lib/Encoder";

import { QtspClausesMetadata } from "../../../qtsp-clauses-metadata";

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
    nonce,
  }) => ({
    clauses,
    document_url: documentUrl.href,
    privacy_url: privacyUrl.href,
    terms_and_conditions_url: termsAndConditionsUrl.href,
    privacy_text: privacyText,
    nonce,
  }),
};
