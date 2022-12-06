import {
  NonEmptyString,
  WithinRangeString,
} from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";

import { NonNegativeNumber } from "@pagopa/ts-commons/lib/numbers";
import { SignatureFieldAttributes } from "@io-sign/io-sign/document";

const ClauseType = t.keyof({
  REQUIRED: null,
  UNFAIR: null,
  OPTIONAL: null,
});

const ClauseTitle = WithinRangeString(5, 80);

const Clause = t.type({
  title: ClauseTitle,
  type: ClauseType,
});

type Clause = t.TypeOf<typeof Clause>;

export const SignatureFieldToBeCreatedAttributes = t.type({
  bottom_left: t.type({
    x: NonNegativeNumber,
    y: NonNegativeNumber,
  }),
  top_right: t.type({
    x: NonNegativeNumber,
    y: NonNegativeNumber,
  }),
  page: NonNegativeNumber,
});

export type SignatureFieldToBeCreatedAttributes = t.TypeOf<
  typeof SignatureFieldToBeCreatedAttributes
>;

export const SignatureField = t.type({
  attributes: t.union([
    SignatureFieldAttributes,
    SignatureFieldToBeCreatedAttributes,
  ]),
  clause: Clause,
});

export type SignatureField = t.TypeOf<typeof SignatureField>;

export const DocumentToSign = t.type({
  documentId: NonEmptyString,
  signatureFields: t.array(SignatureField),
});
export type DocumentToSign = t.TypeOf<typeof DocumentToSign>;
