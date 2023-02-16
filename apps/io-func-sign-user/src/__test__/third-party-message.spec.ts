import { describe, it, expect } from "@jest/globals";

import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import {
  EmailString,
  NonEmptyString,
  WithinRangeString,
} from "@pagopa/ts-commons/lib/strings";

import { addDays } from "date-fns";

import { newId } from "@io-sign/io-sign/id";
import { SignatureRequestSigned } from "@io-sign/io-sign/signature-request";
import { DocumentReady } from "@io-sign/io-sign/document";
import {
  makeGetSignedDocumentContent,
  signedNoMoreThan90DaysAgo,
} from "../app/use-cases/get-signed-document-content";

const documentId = newId();

const signatureRequest: SignatureRequestSigned = {
  id: newId(),
  dossierId: newId(),
  issuerId: newId(),
  issuerEmail: "issuer@io-sign-mail.it" as EmailString,
  issuerDescription: "Mocked Issuer" as NonEmptyString,
  issuerEnvironment: "TEST",
  signerId: newId(),
  createdAt: new Date(),
  updatedAt: new Date(),
  expiresAt: new Date(),
  signedAt: new Date(),
  status: "SIGNED",
  documents: [
    {
      id: documentId,
      status: "READY",
      uploadedAt: new Date(),
      updatedAt: new Date(),
      url: "",
      createdAt: new Date(),
      metadata: {
        title: "demo doc",
        signatureFields: [
          {
            attributes: { uniqueName: "field" as NonEmptyString },
            clause: {
              title: "Firma demo" as WithinRangeString<5, 80>,
              type: "REQUIRED",
            },
          },
        ],
        pdfDocumentMetadata: {
          pages: [],
          formFields: [],
        },
      },
    },
  ],
};

const getDocumentContent = (_document: DocumentReady) =>
  TE.right(Buffer.alloc(0));

describe("getSignedDocumentContent", () => {
  it('should return a buffer for a specific documentId"', () => {
    const getSignedDocumentContent =
      makeGetSignedDocumentContent(getDocumentContent);

    const makeRequest = getSignedDocumentContent(
      signatureRequest,
      documentId
    )();
    return makeRequest.then((data) => {
      expect(pipe(data, E.isRight)).toBe(true);
    });
  });

  it('should return an Error for a documentId that does not exist"', () => {
    const getSignedDocumentContent =
      makeGetSignedDocumentContent(getDocumentContent);

    const makeRequest = getSignedDocumentContent(signatureRequest, newId())();
    return makeRequest.then((data) => {
      expect(pipe(data, E.isRight)).toBe(false);
    });
  });
});

describe("signedNoMoreThan90DaysAgo", () => {
  it('should not return an error for a signature request signed more than 89 days ago"', () => {
    const oldSignatureRequest = {
      ...signatureRequest,
      signedAt: addDays(signatureRequest.signedAt, -89),
    };
    expect(
      pipe(oldSignatureRequest, signedNoMoreThan90DaysAgo, E.isRight)
    ).toBe(true);
  });

  it('should return an error for a signature request signed more than 90 days ago"', () => {
    const oldSignatureRequest = {
      ...signatureRequest,
      signedAt: addDays(signatureRequest.signedAt, -90),
    };
    expect(
      pipe(oldSignatureRequest, signedNoMoreThan90DaysAgo, E.isRight)
    ).toBe(false);
  });
});
