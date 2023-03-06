/**
 * Do not edit this file it is auto-generated by io-utils / gen-api-models.
 * See https://github.com/pagopa/io-utils
 */
/* eslint-disable  */

import { withDefault } from "@pagopa/ts-commons/lib/types";
import * as t from "io-ts";
import {
  IWithinRangeIntegerTag,
  WithinRangeInteger
} from "@pagopa/ts-commons/lib/numbers";

// required attributes
const ProblemDetailR = t.interface({});

// optional attributes
const ProblemDetailO = t.partial({
  type: withDefault(t.string, "about:blank"),

  title: t.string,

  status: t.union([
    WithinRangeInteger<100, 599, IWithinRangeIntegerTag<100, 599>>(100, 599),
    t.literal(599)
  ]),

  detail: t.string,

  instance: t.string
});

export const ProblemDetail = t.exact(
  t.intersection([ProblemDetailR, ProblemDetailO], "ProblemDetail")
);

export type ProblemDetail = t.TypeOf<typeof ProblemDetail>;
