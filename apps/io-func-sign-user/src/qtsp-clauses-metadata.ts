import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { UrlFromString } from "@pagopa/ts-commons/lib/url";
import * as t from "io-ts";

export const QtspClause = t.type({
  text: NonEmptyString,
});

export type QtspClause = t.TypeOf<typeof QtspClause>;

export const QtspClausesMetadata = t.type({
  clauses: t.array(QtspClause),
  documentUrl: UrlFromString,
  privacyUrl: UrlFromString,
  termsAndConditionsUrl: UrlFromString,
  privacyText: NonEmptyString,
  nonce: NonEmptyString,
});

export type QtspClausesMetadata = t.TypeOf<typeof QtspClausesMetadata>;
