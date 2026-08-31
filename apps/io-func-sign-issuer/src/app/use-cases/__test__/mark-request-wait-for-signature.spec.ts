import { describe, it, expect, vi } from "vitest";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";

import { newId } from "@io-sign/io-sign/id";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { SignatureRequest } from "../../../signature-request";
import { CreateAndSendSignEvent, EventName } from "@io-sign/io-sign/sign-event";
import { makeMarkRequestAsWaitForSignature } from "../mark-request-wait-for-signature";

const issuerId = newId();
const signatureRequestId = newId();

// A READY request — markAsWaitForSignature transitions it to WAIT_FOR_SIGNATURE
const signatureRequest: SignatureRequest = {
  id: signatureRequestId,
  issuerId,
  issuerEmail: "test@example.com" as EmailString,
  issuerDescription: "Test Issuer" as NonEmptyString,
  issuerInternalInstitutionId: newId(),
  issuerEnvironment: "TEST",
  issuerDepartment: "dep1" as NonEmptyString,
  signerId: newId(),
  dossierId: newId(),
  dossierTitle: "Test Dossier" as NonEmptyString,
  status: "READY",
  createdAt: new Date(),
  updatedAt: new Date(),
  expiresAt: new Date(Date.now() + 86400000),
  documents: [],
};

const qrCodeUrl = "https://qr.example.com";

describe("makeMarkRequestAsWaitForSignature", () => {
  it("sends a SIGNATURE_WAIT_FOR_SIGNATURE event on success", async () => {
    const sendEvent = vi.fn((req: SignatureRequest) => TE.right(req));
    const createAndSendSignEvent = vi.fn(
      () => sendEvent
    ) as unknown as CreateAndSendSignEvent;

    const result = await makeMarkRequestAsWaitForSignature(
      (_id) => (_issuerId) => TE.right(O.some(signatureRequest)),
      (req) => TE.right(req),
      createAndSendSignEvent
    )({ id: signatureRequestId, issuerId, qrCodeUrl } as any)();

    expect(E.isRight(result)).toBe(true);
    expect(createAndSendSignEvent).toHaveBeenCalledWith(
      EventName.SIGNATURE_WAIT_FOR_SIGNATURE
    );
    expect(sendEvent).toHaveBeenCalledOnce();
  });

  it("does not send an event when the signature request is not found", async () => {
    const sendEvent = vi.fn((req: SignatureRequest) => TE.right(req));
    const createAndSendSignEvent = vi.fn(
      () => sendEvent
    ) as unknown as CreateAndSendSignEvent;

    const result = await makeMarkRequestAsWaitForSignature(
      (_id) => (_issuerId) => TE.right(O.none),
      (req) => TE.right(req),
      createAndSendSignEvent
    )({ id: signatureRequestId, issuerId, qrCodeUrl } as any)();

    expect(E.isLeft(result)).toBe(true);
    // The outer factory is called eagerly when building the chain,
    // but the inner sender must not be invoked if the pipeline short-circuits.
    expect(sendEvent).not.toHaveBeenCalled();
  });
});
