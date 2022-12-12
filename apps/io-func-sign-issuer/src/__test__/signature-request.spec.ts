import { describe, it, test, expect } from "@jest/globals";

import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import { addDays, isEqual, subDays } from "date-fns/fp";
import { newSigner } from "@io-sign/io-sign/signer";
import { newId } from "@io-sign/io-sign/id";
import { newDossier } from "../dossier";
import { newSignatureRequest, withExpiryDate } from "../signature-request";
import { Issuer } from "../issuer";

const issuer: Issuer = {
  id: newId(),
  subscriptionId: newId(),
  externalId: "ext_id",
  version: "10",
  email: "info@enpacl-pec.it",
  address: "Viale Del Caravaggio, 78 - 00147 Roma (RM)",
  description: "descrizione dell'ente",
  taxCode: "80119170589",
  vatNumber: "80119170589",
};

const dossier = newDossier(issuer, "My dossier", [
  {
    title: "document #1",
    signatureFields: [],
    pages: [],
  },
  {
    title: "document #2",
    signatureFields: [],
    pages: [],
  },
]);

describe("SignatureRequest", () => {
  describe("newSignatureRequest", () => {
    it('should create a request with "DRAFT" status', () => {
      const request = newSignatureRequest(dossier, newSigner());
      expect(request.status).toBe("DRAFT");
    });
    test('all documents should be created with "WAIT_FOR_UPLOAD" status', () => {
      const request = newSignatureRequest(dossier, newSigner());
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
          newSignatureRequest(dossier, newSigner()),
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
          newSignatureRequest(dossier, newSigner()),
          withExpiryDate(pipe(new Date(), subDays(100))),
          E.isLeft
        )
      ).toBe(true);
    });
  });
});
