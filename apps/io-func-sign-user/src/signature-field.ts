import * as t from "io-ts";

import { NonNegativeNumber } from "@pagopa/ts-commons/lib/numbers";
import {
  Clause,
  SignatureFieldAttributes,
  SignatureFieldToBeCreatedAttributes as AttributesWithCoordsAndSize,
} from "@io-sign/io-sign/document";

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

export const toSignatureFieldToBeCreatedAttributes = ({
  coordinates,
  size,
  page: { number: page, height },
}: AttributesWithCoordsAndSize): SignatureFieldToBeCreatedAttributes => ({
  bottomLeft: {
    x: coordinates.x,
    y: height - coordinates.y + size.h,
  },
  topRight: {
    x: coordinates.x + size.w,
    y: height - coordinates.y,
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
