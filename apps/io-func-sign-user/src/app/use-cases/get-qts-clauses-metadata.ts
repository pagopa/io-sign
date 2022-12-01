import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { HttpBadRequestError } from "@internal/io-sign/infra/http/errors";
import { NamirialClient } from "../../infra/namirial/client";

export const makeGetQtspClausesMetadata =
  (namirialClient: NamirialClient) => () =>
    pipe(
      TE.tryCatch(namirialClient.getClauses, E.toError),
      TE.mapLeft((e) => new HttpBadRequestError(e.message)),
      TE.map((res) => ({
        clauses: res.clauses,
        documentUrl: res.document_link,
        privacyUrl: res.privacy_link,
        termsAndConditionsUrl: res.terms_and_conditions_link,
        privacyText: res.privacy_text,
        nonce: res.nonce,
      }))
    );
