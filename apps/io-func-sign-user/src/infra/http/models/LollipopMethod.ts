/**
 * Do not edit this file it is auto-generated by io-utils / gen-api-models.
 * See https://github.com/pagopa/io-utils
 */
/* eslint-disable  */

import { enumType } from "@pagopa/ts-commons/lib/types";
import * as t from "io-ts";

export enum LollipopMethodEnum {
  "GET" = "GET",

  "POST" = "POST",

  "PUT" = "PUT",

  "PATCH" = "PATCH",

  "DELETE" = "DELETE"
}

export type LollipopMethod = t.TypeOf<typeof LollipopMethod>;
export const LollipopMethod = enumType<LollipopMethodEnum>(
  LollipopMethodEnum,
  "LollipopMethod"
);