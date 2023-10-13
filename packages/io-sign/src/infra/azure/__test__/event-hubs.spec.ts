import { describe, it, expect } from "vitest";

import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";

import { EventHubProducerClient } from "@azure/event-hubs";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { makeCreateAndSendAnalyticsEvent } from "../event-hubs/event";
import { newId } from "../../../id";
import { Issuer } from "../../../issuer";
import { SignatureRequestSigned } from "../../../signature-request";
import { EventName } from "../../../event";

const issuer: Issuer = {
  id: newId(),
  subscriptionId: newId(),
  email: "issuer@io-sign-mail.it" as EmailString,
  description: "Mocked Issuer" as NonEmptyString,
  internalInstitutionId: newId(),
  environment: "TEST",
  vatNumber: "IT01234567" as NonEmptyString,
  department: "",
  state: "ACTIVE",
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
  issuerDepartment: issuer.department,
  signerId: newId(),
  createdAt: new Date(),
  updatedAt: new Date(),
  expiresAt: new Date(),
  status: "SIGNED",
  signedAt: new Date(),
  documents: [],
};

const createAndSendAnalyticsEvent = makeCreateAndSendAnalyticsEvent(
  undefined as unknown as EventHubProducerClient
);

describe("EventHubs [infra]", () => {
  describe("createAndSendAnalyticsEvent", () => {
    it("should always return a right TaskEither", async () => {
      const result = pipe(
        signatureRequest,
        createAndSendAnalyticsEvent(EventName.SIGNATURE_SIGNED)
      );
      await expect(result()).resolves.toStrictEqual(E.right(signatureRequest));
    });
  });
});
