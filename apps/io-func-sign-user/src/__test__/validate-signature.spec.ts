import { describe, expect, it } from "vitest";

import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { newId } from "@io-sign/io-sign/id";
import { CreateAndSendSignEvent } from "@io-sign/io-sign/sign-event";
import {
  SignatureRequest as QtspSignatureRequest
} from "../infra/namirial/signature-request";
import { GetBlobUrl } from "../infra/azure/storage/blob";
import {
  GetSignature,
  Signature,
  UpsertSignature
} from "../signature";
import {
  GetSignatureRequest,
  NotifySignatureRequestRejectedEvent,
  NotifySignatureRequestSignedEvent,
  SignatureRequest,
  UpsertSignatureRequest
} from "../signature-request";
import { makeValidateSignature } from "../app/use-cases/validate-signature";
import { GetSignatureRequest as GetQtspSignatureRequest } from "../infra/namirial/signature-request";

const createHarness = (options?: {
  failRequestUpsertOnce?: boolean;
  failSignedNotificationOnce?: boolean;
}) => {
  const signatureId = newId();
  const signerId = newId();
  const signatureRequestId = newId();
  const qtspSignatureRequestId = newId();
  const initialSignature: Signature = {
    id: signatureId,
    signerId,
    signatureRequestId,
    qtspSignatureRequestId,
    status: "WAITING",
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const initialSignatureRequest: SignatureRequest = {
    id: signatureRequestId,
    dossierId: newId(),
    dossierTitle: "Signing request" as NonEmptyString,
    issuerId: newId(),
    issuerEmail: "issuer@example.com" as EmailString,
    issuerDescription: "Test issuer" as NonEmptyString,
    issuerInternalInstitutionId: newId(),
    issuerEnvironment: "TEST",
    issuerDepartment: "",
    signerId,
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(),
    status: "WAIT_FOR_QTSP",
    documents: [],
    qrCodeUrl: "https://example.com/qr"
  };
  const qtspSignatureRequest: QtspSignatureRequest = {
    id: qtspSignatureRequestId,
    created_at: new Date(),
    status: "COMPLETED",
    last_error: null
  };

  let storedSignature = initialSignature;
  let storedSignatureRequest: SignatureRequest = initialSignatureRequest;
  let requestUpsertFailures = options?.failRequestUpsertOnce ? 1 : 0;
  let notificationFailures = options?.failSignedNotificationOnce ? 1 : 0;
  let signatureUpsertCount = 0;
  let requestUpsertCount = 0;
  let signedNotificationCount = 0;
  const calls: string[] = [];

  const getSignature: GetSignature = () => () =>
    TE.right(O.some(storedSignature));
  const getSignatureRequest: GetSignatureRequest = () => () =>
    TE.right(O.some(storedSignatureRequest));
  const getQtspSignatureRequest: GetQtspSignatureRequest = () => () =>
    TE.right(qtspSignatureRequest);
  const getSignedDocumentUrl: GetBlobUrl = () => O.some("https://signed.test");
  const upsertSignature: UpsertSignature = (signature) => {
    calls.push("signature");
    signatureUpsertCount += 1;
    storedSignature = signature;
    return TE.right(signature);
  };
  const upsertSignatureRequest: UpsertSignatureRequest = (request) => {
    calls.push("signatureRequest");
    requestUpsertCount += 1;
    if (requestUpsertFailures > 0) {
      requestUpsertFailures -= 1;
      return TE.left(new Error("temporary signature request upsert failure"));
    }
    storedSignatureRequest = request;
    return TE.right(request);
  };
  const notifySigned: NotifySignatureRequestSignedEvent = () => {
    calls.push("notifySigned");
    signedNotificationCount += 1;
    if (notificationFailures > 0) {
      notificationFailures -= 1;
      return TE.left(new Error("temporary notification failure"));
    }
    return TE.right("sent");
  };
  const notifyRejected: NotifySignatureRequestRejectedEvent = () =>
    TE.right("sent");
  const createAndSendSignEvent: CreateAndSendSignEvent = () => (request) =>
    TE.right(request);

  const validate = makeValidateSignature(
    getSignature,
    getSignedDocumentUrl,
    upsertSignature,
    getSignatureRequest,
    upsertSignatureRequest,
    getQtspSignatureRequest,
    notifySigned,
    notifyRejected,
    createAndSendSignEvent
  )({ signatureId, signerId });

  return {
    validate,
    calls,
    getStoredSignature: () => storedSignature,
    getStoredSignatureRequest: () => storedSignatureRequest,
    getCounts: () => ({
      signatureUpsertCount,
      requestUpsertCount,
      signedNotificationCount
    })
  };
};

describe("makeValidateSignature completed retry flow", () => {
  it("retries after the signature request upsert fails", async () => {
    const harness = createHarness({ failRequestUpsertOnce: true });

    const firstAttempt = await harness.validate();

    expect(E.isLeft(firstAttempt)).toBe(true);
    expect(harness.getStoredSignature().status).toBe("COMPLETED");
    expect(harness.getStoredSignatureRequest().status).toBe("WAIT_FOR_QTSP");

    const retry = await harness.validate();

    expect(E.isRight(retry)).toBe(true);
    expect(harness.getStoredSignature().status).toBe("COMPLETED");
    expect(harness.getStoredSignatureRequest().status).toBe("SIGNED");
    expect(harness.getCounts()).toEqual({
      signatureUpsertCount: 2,
      requestUpsertCount: 2,
      signedNotificationCount: 1
    });
    expect(harness.calls).toEqual([
      "signature",
      "signatureRequest",
      "signature",
      "signatureRequest",
      "notifySigned"
    ]);
  });

  it("retries notification after the signed request was already persisted", async () => {
    const harness = createHarness({ failSignedNotificationOnce: true });

    const firstAttempt = await harness.validate();

    expect(E.isLeft(firstAttempt)).toBe(true);
    expect(harness.getStoredSignatureRequest().status).toBe("SIGNED");

    const retry = await harness.validate();

    expect(E.isRight(retry)).toBe(true);
    expect(harness.getStoredSignatureRequest().status).toBe("SIGNED");
    expect(harness.getCounts()).toEqual({
      signatureUpsertCount: 2,
      requestUpsertCount: 2,
      signedNotificationCount: 2
    });
  });
});