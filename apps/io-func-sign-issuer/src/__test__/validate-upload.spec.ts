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
import {
  isValidSignatureField,
  isValidSignatureFieldToBeCreated,
} from "../app/use-cases/validate-upload";

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
      payload: {},
      expected: false,
    },
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
  ])("should be valid ($#)", ({ payload, expected }) =>
    expect(
      pipe(
        payload as unknown as SignatureFieldAttributes,
        isValidSignatureField(pdfDocumentMetadata.formFields),
        E.isRight
      )
    ).toBe(expected)
  );
});

describe("validateSignatureFieldToBeCreated", () => {
  it.each([
    {
      payload: {},
      expected: false,
    },
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
  ])("should be valid ($#)", ({ payload, expected }) =>
    expect(
      pipe(
        payload as unknown as SignatureFieldToBeCreatedAttributes,
        isValidSignatureFieldToBeCreated(pdfDocumentMetadata.pages),
        E.isRight
      )
    ).toBe(expected)
  );
});
