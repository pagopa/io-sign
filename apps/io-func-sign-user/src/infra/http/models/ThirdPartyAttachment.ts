/**
 * Do not edit this file it is auto-generated by io-utils / gen-api-models.
 * See https://github.com/pagopa/io-utils
 */
/* eslint-disable  */

import * as t from "io-ts";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

// required attributes
const ThirdPartyAttachmentR = t.interface({
  id: NonEmptyString,

  url: NonEmptyString
});

// optional attributes
const ThirdPartyAttachmentO = t.partial({
  content_type: NonEmptyString,

  name: NonEmptyString
});

export const ThirdPartyAttachment = t.exact(
  t.intersection(
    [ThirdPartyAttachmentR, ThirdPartyAttachmentO],
    "ThirdPartyAttachment"
  )
);

export type ThirdPartyAttachment = t.TypeOf<typeof ThirdPartyAttachment>;