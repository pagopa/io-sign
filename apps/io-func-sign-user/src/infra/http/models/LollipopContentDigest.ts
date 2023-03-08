/**
 * Do not edit this file it is auto-generated by io-utils / gen-api-models.
 * See https://github.com/pagopa/io-utils
 */
/* eslint-disable  */

import { PatternString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";

export type LollipopContentDigest = t.TypeOf<typeof LollipopContentDigest>;
export const LollipopContentDigest = PatternString(
  "^(sha-256=:[A-Za-z0-9+/=]{44}:|sha-384=:[A-Za-z0-9+/=]{66}:|sha-512=:[A-Za-z0-9+/=]{88}:)$"
);