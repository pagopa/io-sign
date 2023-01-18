import { describe, it, expect } from "@jest/globals";

import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import {
  PdfDocumentMetadata,
  SignatureFieldAttributes,
  SignatureFieldToBeCreatedAttributes,
} from "@io-sign/io-sign/document";

import { NonNegativeNumber } from "@pagopa/ts-commons/lib/numbers";
import { validate } from "@io-sign/io-sign/validation";
import {
  isValidSignatureField,
  isValidSignatureFieldToBeCreated,
} from "../validate-upload";

const pdfDocumentMetadata: PdfDocumentMetadata = {
  pages: [
    {
      number: 0 as NonNegativeNumber,
      width: 200 as NonNegativeNumber,
      height: 800 as NonNegativeNumber,
    },
  ],
  formFields: [
    { type: "PDFSignature", name: "fieldId1" },
    { type: "PDFSignature", name: "fieldId2" },
  ],
};

describe("validateSignatureField", () => {
  it.each([
    {
      payload: {
        uniqueName: "fieldId1" as NonEmptyString,
      },
      expected: true,
    },
    {
      payload: {
        uniqueName: "fieldNotPresent" as NonEmptyString,
      },
      expected: false,
    },
  ])("should be valid ($#)", ({ payload, expected }) => {
    const data = pipe(
      payload,
      validate(SignatureFieldAttributes),
      E.chainW(isValidSignatureField(pdfDocumentMetadata.formFields)),
      E.isRight
    );
    expect(data).toBe(expected);
  });
});

describe("validateSignatureFieldToBeCreated", () => {
  it.each([
    {
      payload: {
        coordinates: {
          x: 10 as NonNegativeNumber,
          y: 10 as NonNegativeNumber,
        },
        page: 0 as NonNegativeNumber,
        size: {
          w: 80 as NonNegativeNumber,
          h: 20 as NonNegativeNumber,
        },
      },
      expected: true,
    },
    {
      payload: {
        coordinates: {
          x: 10 as NonNegativeNumber,
          y: 10 as NonNegativeNumber,
        },
        page: 0 as NonNegativeNumber,
        size: {
          w: 1000 as NonNegativeNumber,
          h: 1000 as NonNegativeNumber,
        },
      },
      expected: false,
    },
    {
      payload: {
        coordinates: {
          x: 10 as NonNegativeNumber,
          y: 10 as NonNegativeNumber,
        },
        page: 6 as NonNegativeNumber,
        size: {
          w: 80 as NonNegativeNumber,
          h: 20 as NonNegativeNumber,
        },
      },
      expected: false,
    },
  ])("should be valid ($#)", ({ payload, expected }) => {
    const data = pipe(
      payload,
      validate(SignatureFieldToBeCreatedAttributes),
      E.chainW(isValidSignatureFieldToBeCreated(pdfDocumentMetadata.pages)),
      E.isRight
    );
    expect(data).toBe(expected);
  });
});
