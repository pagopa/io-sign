import * as TE from "fp-ts/lib/TaskEither";

import { pipe } from "fp-ts/lib/function";
import { NamirialClient } from "../../infra/namirial/client";

export const makeGetQtspClausesMetadata =
  (namirialClient: NamirialClient) => () =>
    pipe(
      namirialClient.getClauses(),
      TE.map((res) => ({
        clauses: res.clauses,
        documentUrl: res.document_link,
        privacyUrl: res.privacy_link,
        termsAndConditionsUrl: res.terms_and_conditions_link,
        privacyText: res.privacy_text,
        nonce: res.nonce,
      }))
    );
