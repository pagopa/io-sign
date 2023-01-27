import { describe, it, expect } from "@jest/globals";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { createBillingEvent } from "../event";
import { newId } from "../id";
import { SignatureRequestSigned } from "../signature-request";

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
  status: "SIGNED",
  signedAt: new Date(),
  documents: [],
};

describe("Event", () => {
  describe("createBillingEvent", () => {
    it('should create a new billing event with "io.sign.signature_request.signed" name', () => {
      const event = createBillingEvent(signatureRequest);
      expect(event.name).toBe("io.sign.signature_request.signed");
      expect(event.signatureRequestId).toBe(signatureRequest.id);
      expect(event.issuerId).toBe(signatureRequest.issuerId);
      expect(event.issuerEnvironment).toBe(signatureRequest.issuerEnvironment);
    });
  });
});
