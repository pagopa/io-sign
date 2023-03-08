/**
 * Do not edit this file it is auto-generated by io-utils / gen-api-models.
 * See https://github.com/pagopa/io-utils
 */
/* eslint-disable  */

import { QtspClause } from "./QtspClause";
import * as t from "io-ts";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

// required attributes
const QtspClausesR = t.interface({
  accepted_clauses: t.readonlyArray(QtspClause, "array of QtspClause"),

  filled_document_url: NonEmptyString,

  nonce: NonEmptyString
});

// optional attributes
const QtspClausesO = t.partial({});

export const QtspClauses = t.exact(
  t.intersection([QtspClausesR, QtspClausesO], "QtspClauses")
);

export type QtspClauses = t.TypeOf<typeof QtspClauses>;