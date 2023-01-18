import { describe, it, expect } from "vitest";

import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { newId } from "@io-sign/io-sign/id";
import {
  markAsRejected,
  markAsSigned,
  markAsWaitForQtsp,
  SignatureRequest,
  canBeWaitForQtsp,
} from "../signature-request";

const signatureRequest: SignatureRequest = {
  id: newId(),
  dossierId: newId(),
  issuerId: newId(),
  issuerEmail: "issuer@io-sign-mail.it" as EmailString,
  issuerDescription: "Mocked Issuer" as NonEmptyString,
  signerId: newId(),
  createdAt: new Date(),
  updatedAt: new Date(),
  expiresAt: new Date(),
  status: "WAIT_FOR_SIGNATURE",
  documents: [],
  qrCodeUrl: "https://mock/qrcode",
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
