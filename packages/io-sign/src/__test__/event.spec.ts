import { describe, it, expect } from "@jest/globals";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { createBillingEvent } from "../event";

import { newId } from "../id";
import { Issuer } from "../issuer";
import { SignatureRequestSigned } from "../signature-request";

const issuer: Issuer = {
  id: newId(),
  subscriptionId: newId(),
  email: "issuer@io-sign-mail.it" as EmailString,
  description: "Mocked Issuer" as NonEmptyString,
  internalInstitutionId: newId(),
  environment: "TEST",
  vatNumber: "IT01234567" as NonEmptyString,
};

const signatureRequest: SignatureRequestSigned = {
  id: newId(),
  dossierId: newId(),
  dossierTitle: "Rilascio CIE" as NonEmptyString,
  issuerId: newId(),
  issuerEmail: issuer.email,
  issuerDescription: issuer.description,
  issuerEnvironment: issuer.environment,
  issuerInternalInstitutionId: newId(),
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
      expect(event.pricingPlan).toBe("FREE");
    });
  });
});
