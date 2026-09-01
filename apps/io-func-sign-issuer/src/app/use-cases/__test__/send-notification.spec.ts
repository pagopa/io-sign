import { describe, it, expect, vi } from "vitest";

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import { newId } from "@io-sign/io-sign/id";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

import { DocumentReady } from "@io-sign/io-sign/document";
import { SignerRepository } from "@io-sign/io-sign/signer";
import { Notification, NotificationService } from "@io-sign/io-sign/notification";
import { CreateAndSendSignEvent, EventName } from "@io-sign/io-sign/sign-event";

import { SignatureRequest, UpsertSignatureRequest } from "../../../signature-request";
import { makeSendNotification } from "../send-notification";

const fiscalCode = "MRCLCU65L02C320T" as FiscalCode;

const document: DocumentReady = {
  id: newId(),
  status: "READY",
  metadata: {
    title: "doc #1" as NonEmptyString,
    signatureFields: [] as unknown as DocumentReady["metadata"]["signatureFields"],
    pdfDocumentMetadata: { pages: [], formFields: [] },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  uploadedAt: new Date(),
  url: "https://blob.example.com/doc",
};

const signatureRequest: SignatureRequest = {
  id: newId(),
  issuerId: newId(),
  issuerEmail: "issuer@example.com" as EmailString,
  issuerDescription: "Test Issuer" as NonEmptyString,
  issuerInternalInstitutionId: newId(),
  issuerEnvironment: "TEST",
  issuerDepartment: "dep1" as NonEmptyString,
  signerId: newId(),
  dossierId: newId(),
  dossierTitle: "Test Dossier" as NonEmptyString,
  status: "WAIT_FOR_SIGNATURE",
  createdAt: new Date(),
  updatedAt: new Date(),
  expiresAt: new Date(Date.now() + 86400000),
  documents: [document],
  qrCodeUrl: "https://qr.example.com",
};

const notification: Notification = { ioMessageId: newId() };

const signerRepository: SignerRepository = {
  getFiscalCodeBySignerId: () => TE.right(fiscalCode),
  getSignerByFiscalCode: () => TE.left(new Error("not implemented")),
};

const upsertSignatureRequest: UpsertSignatureRequest = (req) => TE.right(req);

describe("makeSendNotification", () => {
  it("sends a NOTIFICATION_SENT event when the notification is delivered", async () => {
    const sendEvent = vi.fn((req: SignatureRequest) => TE.right(req));
    const createAndSendSignEvent = vi.fn(
      () => sendEvent
    ) as unknown as CreateAndSendSignEvent;

    const notificationService: NotificationService = {
      submit: () => TE.right(notification),
    };

    const result = await makeSendNotification(
      signerRepository,
      notificationService,
      upsertSignatureRequest,
      createAndSendSignEvent
    )({ signatureRequest })();

    expect(E.isRight(result)).toBe(true);
    expect(createAndSendSignEvent).toHaveBeenCalledWith(EventName.NOTIFICATION_SENT);
    expect(sendEvent).toHaveBeenCalledOnce();
  });

  it("sends a NOTIFICATION_REJECTED event when the notification fails", async () => {
    const sendEvent = vi.fn((req: SignatureRequest) => TE.right(req));
    const createAndSendSignEvent = vi.fn(
      () => sendEvent
    ) as unknown as CreateAndSendSignEvent;

    const notificationService: NotificationService = {
      submit: () => TE.left(new Error("IO service unavailable")),
    };

    const result = await makeSendNotification(
      signerRepository,
      notificationService,
      upsertSignatureRequest,
      createAndSendSignEvent
    )({ signatureRequest })();

    expect(E.isLeft(result)).toBe(true);
    expect(createAndSendSignEvent).toHaveBeenCalledWith(
      EventName.NOTIFICATION_REJECTED
    );
    expect(sendEvent).toHaveBeenCalledOnce();
  });
});
