import * as E from "io-ts/lib/Encoder";

import { QtspClausesMetadata } from "../../../qtsp";
import { ClausesMetadata } from "../../namirial/clauses-metadata";

export const NamirialClausesToQtspClauses: E.Encoder<
  QtspClausesMetadata,
  ClausesMetadata
> = {
  encode: (clauses) => ({
    clauses: clauses.clauses,
    documentUrl: clauses.document_link,
    privacyUrl: clauses.privacy_link,
    termsAndConditionsUrl: clauses.terms_and_conditions_link,
    privacyText: clauses.privacy_text,
    nonce: clauses.nonce
  })
};
