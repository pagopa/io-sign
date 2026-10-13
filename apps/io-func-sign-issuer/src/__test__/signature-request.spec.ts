import { describe, it, test, expect, vi, afterEach } from "vitest";

import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import { addDays, addMilliseconds, isEqual, subDays } from "date-fns/fp";
import { newId } from "@io-sign/io-sign/id";
import { Issuer } from "@io-sign/io-sign/issuer";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { DocumentMetadata } from "@io-sign/io-sign/document";
import { newDossier } from "../dossier";
import {
  MAX_EXPIRY_DAYS,
  newSignatureRequest,
  validateMaxExpiryDate,
  withExpiryDate
} from "../signature-request";
import * as O from "fp-ts/lib/Option";

const newSigner = () => ({
  id: newId()
});

const issuer: Issuer = {
  id: newId(),
  subscriptionId: newId(),
  internalInstitutionId: newId(),
  email: "info@enpacl-pec.it" as EmailString,
  description: "descrizione dell'ente" as NonEmptyString,
  environment: "TEST",
  vatNumber: "15376271001" as NonEmptyString,
  department: "",
  status: "ACTIVE"
};

const dossier = newDossier(issuer, "My dossier" as NonEmptyString, [
  {
    title: "document #1",
    signatureFields: [] as unknown as DocumentMetadata["signatureFields"],
    pdfDocumentMetadata: { pages: [], formFields: [] }
  },
  {
    title: "document #2",
    signatureFields: [] as unknown as DocumentMetadata["signatureFields"],
    pdfDocumentMetadata: { pages: [], formFields: [] }
  }
]);

describe("SignatureRequest", () => {
  describe("newSignatureRequest", () => {
    it('should create a request with "DRAFT" status', () => {
      const request = newSignatureRequest(dossier, newSigner(), issuer);
      expect(request.status).toBe("DRAFT");
    });
    test('all documents should be created with "WAIT_FOR_UPLOAD" status', () => {
      const request = newSignatureRequest(dossier, newSigner(), issuer);
      expect(
        request.documents.every(
          (document) => document.status === "WAIT_FOR_UPLOAD"
        )
      ).toBe(true);
    });
  });

  describe("withExpiryDate", () => {
    it("should update the expiry date", () => {
      const newExpiryDate = pipe(new Date(), addDays(4));
      expect(
        pipe(
          newSignatureRequest(dossier, newSigner(), issuer),
          withExpiryDate(newExpiryDate),
          E.map((request) => request.expiresAt),
          E.map(isEqual(newExpiryDate)),
          E.getOrElse(() => false)
        )
      ).toBe(true);
    });
    it("should return an error on invalid expiry date", () => {
      expect(
        pipe(
          newSignatureRequest(dossier, newSigner(), issuer),
          withExpiryDate(pipe(new Date(), subDays(100))),
          E.isLeft
        )
      ).toBe(true);
    });
  });

  describe("validateMaxExpiryDate", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should accept an expiry date within the max expiry days", () => {
      vi.useFakeTimers({ now });
      expect(pipe(now, addDays(30), validateMaxExpiryDate, E.isRight)).toBe(
        true
      );
    });

    it("should accept an expiry date exactly at the max expiry days", () => {
      vi.useFakeTimers({ now });
      expect(
        pipe(now, addDays(MAX_EXPIRY_DAYS), validateMaxExpiryDate, E.isRight)
      ).toBe(true);
    });
    
    it("should return an error on an expiry date beyond the max expiry days", () => {
      vi.useFakeTimers({ now });
      expect(
        pipe(
          now,
          addDays(MAX_EXPIRY_DAYS),
          addMilliseconds(1),
          validateMaxExpiryDate,
          E.isLeft
        )
      ).toBe(true);
    });
  });
});
