/**
 * Do not edit this file it is auto-generated by io-utils / gen-api-models.
 * See https://github.com/pagopa/io-utils
 */
/* eslint-disable  */

import { SignatureField } from "./SignatureField";
import * as t from "io-ts";
import { WithinRangeString } from "@pagopa/ts-commons/lib/strings";

// required attributes
const DocumentMetadataR = t.interface({
  title: WithinRangeString(3, 61)
});

// optional attributes
const DocumentMetadataO = t.partial({
  signature_fields: t.readonlyArray(SignatureField, "array of SignatureField")
});

export const DocumentMetadata = t.exact(
  t.intersection([DocumentMetadataR, DocumentMetadataO], "DocumentMetadata")
);

export type DocumentMetadata = t.TypeOf<typeof DocumentMetadata>;