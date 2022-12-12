import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";

export const ClausesMetadata = t.type({
  privacy_text: NonEmptyString,
  document_link: NonEmptyString,
  privacy_link: NonEmptyString,
  terms_and_conditions_link: NonEmptyString,
  clauses: t.array(t.type({ text: NonEmptyString })),
  nonce: NonEmptyString,
});

export type ClausesMetadata = t.TypeOf<typeof ClausesMetadata>;
