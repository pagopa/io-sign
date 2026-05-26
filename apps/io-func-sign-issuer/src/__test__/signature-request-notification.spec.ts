import { describe, it, expect } from "vitest";

import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

import { newId } from "@io-sign/io-sign/id";
import { Issuer } from "@io-sign/io-sign/issuer";
import { Notification } from "@io-sign/io-sign/notification";
import {
  EmailString,
  FiscalCode,
  NonEmptyString,
} from "@pagopa/ts-commons/lib/strings";
import { NotificationMessage } from "@io-sign/io-sign/notification";
import { validate } from "@io-sign/io-sign/validation";
import { DocumentMetadata } from "@io-sign/io-sign/document";
import { SignerRepository } from "@io-sign/io-sign/signer";
import { NotificationService } from "@io-sign/io-sign/notification";
import { Dossier, newDossier } from "../dossier";
import { newSignatureRequest, SignatureRequest } from "../signature-request";
import { sendSignatureRequestNotification } from "../signature-request-notification";

const newSigner = () => ({
  id: newId(),
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
  status: "ACTIVE",
};

const dossier = newDossier(issuer, "My dossier" as NonEmptyString, [
  {
    title: "document #1",
    signatureFields: [] as unknown as DocumentMetadata["signatureFields"],
    pdfDocumentMetadata: { pages: [], formFields: [] },
  },
]);

const mockFiscalCode = pipe(
  "AAABBB00A00B000A",
  validate(FiscalCode, "Fiscal code is not valid"),
  E.getOrElseW(() => {
    throw new Error("Invalid fiscal code in test setup");
  })
);

const mockSignerRepository: SignerRepository = {
  getSignerByFiscalCode: () => TE.right({ id: newId() }),
  getFiscalCodeBySignerId: () => TE.right(mockFiscalCode),
};

const mockNotificationService: NotificationService = {
  submit: () =>
    pipe(
      { ioMessageId: "0000" },
      validate(Notification, "Invalid notification message"),
      TE.fromEither
    ),
};

const buildMessage = (_req: SignatureRequest): NotificationMessage => ({
  subject: "Richiesta di Firma",
  markdown: "Message content",
});

describe("SignatureRequestNotification", () => {
  describe("sendSignatureRequestNotification", () => {
    it("should send a signature request notification", () => {
      const request = newSignatureRequest(dossier, newSigner(), issuer);
      const send = sendSignatureRequestNotification(buildMessage)(request);
      return send({
        signerRepository: mockSignerRepository,
        notificationService: mockNotificationService,
      })().then((result) => {
        expect(E.isRight(result)).toBe(true);
      });
    });

    it("should return Left when notification submission fails", () => {
      const failingNotificationService: NotificationService = {
        submit: () =>
          pipe(
            {},
            validate(Notification, "Invalid notification message"),
            TE.fromEither
          ),
      };
      const request = newSignatureRequest(dossier, newSigner(), issuer);
      const send = sendSignatureRequestNotification(buildMessage)(request);
      return send({
        signerRepository: mockSignerRepository,
        notificationService: failingNotificationService,
      })().then((result) => {
        expect(E.isLeft(result)).toBe(true);
      });
    });

    it("should return Left when fiscal code retrieval fails", () => {
      const failingSignerRepository: SignerRepository = {
        getSignerByFiscalCode: () => TE.right({ id: newId() }),
        getFiscalCodeBySignerId: () =>
          TE.left(new Error("Fiscal code not found")),
      };
      const request = newSignatureRequest(dossier, newSigner(), issuer);
      const send = sendSignatureRequestNotification(buildMessage)(request);
      return send({
        signerRepository: failingSignerRepository,
        notificationService: mockNotificationService,
      })().then((result) => {
        expect(E.isLeft(result)).toBe(true);
      });
    });
  });
});
