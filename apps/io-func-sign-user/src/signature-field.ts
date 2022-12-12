import * as t from "io-ts";
import { NonNegativeNumber } from "@pagopa/ts-commons/lib/numbers";
import {
  Clause,
  SignatureFieldAttributes,
  SignatureFieldToBeCreatedAttributes as AttributesWithCoordsAndSize,
} from "@io-sign/io-sign/document";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

export const SignatureFieldToBeCreatedAttributes = t.type({
  bottomLeft: t.type({
    x: t.number,
    y: t.number,
  }),
  topRight: t.type({
    x: t.number,
    y: t.number,
  }),
  page: NonNegativeNumber,
});

export type SignatureFieldToBeCreatedAttributes = t.TypeOf<
  typeof SignatureFieldToBeCreatedAttributes
>;

export const toSignatureFieldToBeCreatedAttributes =
  (pageHeight: NonNegativeNumber) =>
  ({
    coordinates,
    size,
    page,
  }: AttributesWithCoordsAndSize): SignatureFieldToBeCreatedAttributes => ({
    bottomLeft: {
      x: coordinates.x,
      y: pageHeight - coordinates.y + size.h,
    },
    topRight: {
      x: coordinates.x + size.w,
      y: pageHeight - coordinates.y,
    },
    page,
  });

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
