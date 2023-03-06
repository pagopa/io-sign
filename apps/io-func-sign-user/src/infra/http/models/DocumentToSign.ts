/**
 * Do not edit this file it is auto-generated by io-utils / gen-api-models.
 * See https://github.com/pagopa/io-utils
 */
/* eslint-disable  */

import { SignatureField } from "./SignatureField";
import * as t from "io-ts";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

// required attributes
const DocumentToSignR = t.interface({
  document_id: NonEmptyString,

  signature_fields: t.readonlyArray(SignatureField, "array of SignatureField")
});

// optional attributes
const DocumentToSignO = t.partial({});

export const DocumentToSign = t.exact(
  t.intersection([DocumentToSignR, DocumentToSignO], "DocumentToSign")
);

export type DocumentToSign = t.TypeOf<typeof DocumentToSign>;
