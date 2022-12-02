import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { UrlFromString } from "@pagopa/ts-commons/lib/url";
import * as t from "io-ts";

export const ClausesMetadata = t.type({
  privacy_text: NonEmptyString,
  document_link: UrlFromString,
  privacy_link: UrlFromString,
  terms_and_conditions_link: UrlFromString,
  clauses: t.array(t.type({ text: NonEmptyString })),
  nonce: NonEmptyString,
});

export type ClausesMetadata = t.TypeOf<typeof ClausesMetadata>;
