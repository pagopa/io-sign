import { describe, it, test, expect } from "vitest";

import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import { addDays, isEqual, subDays } from "date-fns/fp";
import { newSigner } from "@io-sign/io-sign/signer";
import { newId } from "@io-sign/io-sign/id";
import { Issuer } from "@io-sign/io-sign/issuer";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { DocumentMetadata } from "@io-sign/io-sign/document";
import { newDossier } from "../dossier";
import { newSignatureRequest, withExpiryDate } from "../signature-request";
import * as O from "fp-ts/lib/Option";

const issuer: Issuer = {
  id: newId(),
  subscriptionId: newId(),
  internalInstitutionId: newId(),
  email: "info@enpacl-pec.it" as EmailString,
  description: "descrizione dell'ente" as NonEmptyString,
  environment: "TEST",
  vatNumber: "15376271001" as NonEmptyString,
  department: "",
};

const dossier = newDossier(issuer, "My dossier" as NonEmptyString, [
  {
    title: "document #1",
    signatureFields: [] as unknown as DocumentMetadata["signatureFields"],
    pdfDocumentMetadata: { pages: [], formFields: [] },
  },
  {
    title: "document #2",
    signatureFields: [] as unknown as DocumentMetadata["signatureFields"],
    pdfDocumentMetadata: { pages: [], formFields: [] },
  },
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
});
