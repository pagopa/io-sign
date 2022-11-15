import { describe, it, test, expect } from "vitest";

import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import { newSigner } from "@internal/io-sign/signer";
import { addDays, isEqual, subDays } from "date-fns/fp";
import { newIssuer } from "../issuer";
import { newDossier } from "../dossier";
import { newSignatureRequest, withExpiryDate } from "../signature-request";

const issuer = newIssuer("my-sub-id");

const dossier = newDossier(issuer, "My dossier", [
  {
    title: "document #1",
    signatureFields: [],
  },
  {
    title: "document #2",
    signatureFields: [],
  },
]);

describe("SignatureRequest", () => {
  describe.concurrent("newSignatureRequest", () => {
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
