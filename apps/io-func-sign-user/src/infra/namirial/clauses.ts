import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { UrlFromString } from "@pagopa/ts-commons/lib/url";
import * as t from "io-ts";

export const Clauses = t.type({
  id: NonEmptyString,
  title: t.string,
  description: t.string,
  document_link: UrlFromString,
  signed_document_link: UrlFromString,
  privacy_text: NonEmptyString,
  privacy_link: UrlFromString,
  terms_and_conditions_link: UrlFromString,
  clauses: t.array(
    t.type({ id: NonEmptyString, text: NonEmptyString, accepted: t.boolean }),
  ),
});

export type Clauses = t.TypeOf<typeof Clauses>;
