/**
 * Do not edit this file it is auto-generated by io-utils / gen-api-models.
 * See https://github.com/pagopa/io-utils
 */
/* eslint-disable  */

import * as t from "io-ts";
import { SamlUserInfo } from "./SamlUserInfo";
import { OidcUserInfo } from "./OidcUserInfo";

export const LCUserInfo = t.union([SamlUserInfo, OidcUserInfo], "LCUserInfo");

export type LCUserInfo = t.TypeOf<typeof LCUserInfo>;
