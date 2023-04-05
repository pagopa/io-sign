import { describe, it, expect } from "@jest/globals";

import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { addDays } from "date-fns";

import { newId } from "@io-sign/io-sign/id";
import { SignatureRequestSigned } from "@io-sign/io-sign/signature-request";
import {
  markAsRejected,
  markAsSigned,
  markAsWaitForQtsp,
  SignatureRequest,
  canBeWaitForQtsp,
  signedNoMoreThan90DaysAgo,
} from "../signature-request";

const signatureRequest: SignatureRequest = {
  id: newId(),
  dossierId: newId(),
  dossierTitle: "Rilascio CIE" as NonEmptyString,
  issuerId: newId(),
  issuerEmail: "issuer@io-sign-mail.it" as EmailString,
  issuerDescription: "Mocked Issuer" as NonEmptyString,
  issuerInternalInstitutionId: newId(),
  issuerEnvironment: "TEST",
  issuerDepartment: "",
  signerId: newId(),
  createdAt: new Date(),
  updatedAt: new Date(),
  expiresAt: new Date(),
  status: "WAIT_FOR_SIGNATURE",
  documents: [],
  qrCodeUrl: "https://mock/qrcode",
};

const signatureRequestSigned: SignatureRequestSigned = {
  id: newId(),
  dossierId: newId(),
  dossierTitle: "Richiesta borsa di studio" as NonEmptyString,
  issuerId: newId(),
  issuerEmail: "issuer@io-sign-mail.it" as EmailString,
  issuerDescription: "Mocked Issuer" as NonEmptyString,
  issuerInternalInstitutionId: newId(),
  issuerEnvironment: "TEST",
  issuerDepartment: "",
  signerId: newId(),
  createdAt: new Date(),
  updatedAt: new Date(),
  expiresAt: new Date(),
  status: "SIGNED",
  documents: [],
  signedAt: new Date(),
};

describe("signatureRequest status change", () => {
  it('should mark a request with "WAIT_FOR_SIGNATURE" status to "WAIT_FOR_QTSP"', () => {
    expect(
      pipe(
        markAsWaitForQtsp(signatureRequest),
        E.map((marked) => expect(marked.status).toBe("WAIT_FOR_QTSP")),
        E.isRight
      )
    ).toBe(true);
  });

  it('should mark a request with "REJECTED" status to "WAIT_FOR_QTSP"', () => {
    expect(canBeWaitForQtsp(signatureRequest)).toBe(true);
    expect(
      pipe(
        markAsRejected("Rejected reason")(signatureRequest),
        E.chain(markAsWaitForQtsp),
        E.map((marked) => expect(marked.status).toBe("WAIT_FOR_QTSP")),
        E.isRight
      )
    ).toBe(true);
  });

  it('should mark a request with "WAIT_FOR_QTSP" status to "SIGNED"', () => {
    const waitSignatureRequest: SignatureRequest = {
      ...signatureRequest,
      status: "WAIT_FOR_QTSP",
    };
    expect(
      pipe(
        markAsSigned(waitSignatureRequest),
        E.map((marked) => expect(marked.status).toBe("SIGNED")),
        E.isRight
      )
    ).toBe(true);
  });

  it('should not mark a request with "SIGNED" status to "WAIT_FOR_QTSP', () => {
    const waitSignatureRequest: SignatureRequest = {
      ...signatureRequest,
      status: "WAIT_FOR_QTSP",
    };
    expect(
      pipe(
        markAsSigned(waitSignatureRequest),
        E.chain(markAsWaitForQtsp),
        E.isRight
      )
    ).toBe(false);
  });
});

describe("signedNoMoreThan90DaysAgo", () => {
  it('should not return an error for a signature request signed 89 days ago"', () => {
    const oldSignatureRequest = {
      ...signatureRequestSigned,
      signedAt: addDays(signatureRequestSigned.signedAt, -89),
    };
    expect(
      pipe(oldSignatureRequest, signedNoMoreThan90DaysAgo, E.isRight)
    ).toBe(true);
  });

  it('should return an error for a signature request signed 90 days ago"', () => {
    const oldSignatureRequest = {
      ...signatureRequestSigned,
      signedAt: addDays(signatureRequestSigned.signedAt, -90),
    };
    expect(
      pipe(oldSignatureRequest, signedNoMoreThan90DaysAgo, E.isRight)
    ).toBe(false);
  });
});
