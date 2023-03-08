/**
 * Do not edit this file it is auto-generated by io-utils / gen-api-models.
 * See https://github.com/pagopa/io-utils
 */
/* eslint-disable  */

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";

/**
 * A JWT representation of a signed SPID/CIE OIDC Idp
 */

export type OidcSignedJwt = t.TypeOf<typeof OidcSignedJwt>;
export const OidcSignedJwt = NonEmptyString;