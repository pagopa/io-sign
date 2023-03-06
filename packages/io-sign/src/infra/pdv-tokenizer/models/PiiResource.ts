/**
 * Do not edit this file it is auto-generated by io-utils / gen-api-models.
 * See https://github.com/pagopa/io-utils
 */
/* eslint-disable  */

import * as t from "io-ts";

// required attributes
const PiiResourceR = t.interface({
  pii: t.string
});

// optional attributes
const PiiResourceO = t.partial({});

export const PiiResource = t.exact(
  t.intersection([PiiResourceR, PiiResourceO], "PiiResource")
);

export type PiiResource = t.TypeOf<typeof PiiResource>;
