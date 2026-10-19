import { describe, expect, it, vi, afterEach } from "vitest";

import * as L from "@pagopa/logger";

import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { newId } from "@io-sign/io-sign/id";
import { Notification, NotificationService } from "@io-sign/io-sign/notification";
import { SignerRepository } from "@io-sign/io-sign/signer";
import {
  SignatureRequestRejected,
  SignatureRequestSigned
} from "@io-sign/io-sign/signature-request";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { FiscalCode } from "../infra/http/models/FiscalCode";
import { saveMessageId, sendNotification } from "../outcome-notification";
import {
  SignatureRequest,
  SignatureRequestRepository
} from "../signature-request";

const wait: SignatureRequest = {
  id: newId(),
  issuerId: newId(),
  issuerEmail: "issuer.test@mail.pagopa.it" as EmailString,
  issuerDescription: "issuer used in unit tests" as NonEmptyString,
  issuerInternalInstitutionId: newId(),
  issuerEnvironment: "TEST",
  issuerDepartment: "dep1" as NonEmptyString,
  signerId: newId(),
  dossierId: newId(),
  dossierTitle: "Richiesta di firma" as NonEmptyString,
  status: "WAIT_FOR_SIGNATURE",
  createdAt: new Date(),
  updatedAt: new Date(),
  expiresAt: new Date(),
  documents: [],
  qrCodeUrl: "https://my-qr-code"
};

const signed: SignatureRequestSigned = {
  ...wait,
  status: "SIGNED",
  signedAt: new Date()
};

const rejected: SignatureRequestRejected = {
  ...wait,
  status: "REJECTED",
  rejectedAt: new Date(),
  rejectReason: "just a test!"
};

const sentNotification: Notification = {
  ioMessageId: "new-message-id" as NonEmptyString
};

const { repository, notification, log } = vi.hoisted(() => ({
  repository: {
    upsert: vi.fn()
  },
  notification: {
    submit: vi.fn()
  },
  log: vi.fn()
}));

const signatureRequestRepository: SignatureRequestRepository = {
  getById: () => TE.left(new Error("not implemented")),
  get: () => TE.left(new Error("not implemented")),
  upsert: repository.upsert,
  findByDossier: () => Promise.reject(new Error("not implemented")),
  patchDocument: () => TE.left(new Error("not implemented")),
  insert: () => TE.left(new Error("not implemented"))
};

const signerRepository: SignerRepository = {
  getFiscalCodeBySignerId: () =>
    pipe(
      FiscalCode.decode("RSSMRA82M01H501X"),
      TE.fromEither,
      TE.mapLeft(() => new Error("invalid fiscal code"))
    ),
  getSignerByFiscalCode: () => TE.left(new Error("not implemented"))
};

const notificationService: NotificationService = {
  submit: notification.submit
};

const logger: L.Logger = {
  log: (...args) => () => log(...args),
  format: L.format.simple
};

describe("OutcomeNotification", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("sendNotification", () => {
    const send = (request: SignatureRequest) =>
      sendNotification(request)({
        logger,
        signerRepository,
        notificationService
      })();

    const submittedMessage = () => notification.submit.mock.calls[0][1];

    it("should submit the outcome message and return the request with the outcomeNotification", async () => {
      notification.submit.mockReturnValue(TE.right(sentNotification));
      const result = await send(signed);
      expect(result).toEqual(
        E.right({ ...signed, outcomeNotification: sentNotification })
      );
      expect(notification.submit).toHaveBeenCalledWith(
        "RSSMRA82M01H501X",
        expect.anything()
      );
    });

    it("should send the signed documents message for a SIGNED request", async () => {
      notification.submit.mockReturnValue(TE.right(sentNotification));
      await send(signed);
      const message = submittedMessage();
      expect(message).toEqual({
        subject: `Ecco i documenti firmati - ${signed.issuerDescription}`,
        markdown: expect.stringContaining("**90 giorni**"),
        signatureRequestId: signed.id
      });
      expect(message.markdown).toContain(
        `[${signed.issuerEmail}](mailto:${signed.issuerEmail})`
      );
    });

    it("should send the technical problem message for a REJECTED request", async () => {
      notification.submit.mockReturnValue(TE.right(sentNotification));
      await send(rejected);
      const message = submittedMessage();
      expect(message).toEqual({
        subject: `C'è un problema con la firma - ${rejected.issuerDescription}`,
        markdown: expect.stringContaining(`**${rejected.dossierTitle}**`)
      });
      expect(message.markdown).toContain(
        `[${rejected.issuerEmail}](mailto:${rejected.issuerEmail})`
      );
    });

    it("should truncate the subject to 120 chars", async () => {
      notification.submit.mockReturnValue(TE.right(sentNotification));
      await send({
        ...signed,
        issuerDescription: "a".repeat(200) as NonEmptyString
      });
      const { subject } = submittedMessage();
      expect(subject).toHaveLength(120);
      expect(subject.endsWith("...")).toBe(true);
    });

    it("should log and return Left when the notification submission fails", async () => {
      const error = new Error("submit failed");
      notification.submit.mockReturnValue(TE.left(error));
      const result = await send(signed);
      expect(result).toEqual(E.left(error));
      expect(log).toHaveBeenCalledWith(
        expect.stringContaining(
          "Unable to send the signature request notification to the citizen"
        ),
        "error"
      );
    });
  });

  describe("saveMessageId", () => {
    const requestWithOutcomeNotification = {
      ...signed,
      outcomeNotification: sentNotification
    };

    it("should upsert the request with the outcomeNotification", async () => {
      repository.upsert.mockImplementation((request: SignatureRequest) =>
        TE.right(request)
      );
      const result = await saveMessageId(requestWithOutcomeNotification)({
        logger,
        signatureRequestRepository
      })();
      expect(result).toEqual(E.right(requestWithOutcomeNotification));
      expect(repository.upsert).toHaveBeenCalledWith(
        requestWithOutcomeNotification
      );
    });

    it("should log and return Left when the upsert fails", async () => {
      const error = new Error("upsert failed");
      repository.upsert.mockReturnValue(TE.left(error));
      const result = await saveMessageId(requestWithOutcomeNotification)({
        logger,
        signatureRequestRepository
      })();
      expect(result).toEqual(E.left(error));
      expect(log).toHaveBeenCalledWith(
        expect.stringContaining(
          "Unable to save the signature request outcome notification"
        ),
        "error"
      );
    });
  });
});
