import { it, describe, expect, vi, afterEach, beforeAll } from "vitest";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

import {
  ClosedSignatureRequest,
  SignatureRequest,
  SignatureRequestRepository,
} from "../../../signature-request";

import { Issuer } from "@io-sign/io-sign/issuer";

import { newId } from "@io-sign/io-sign/id";

import { NonEmptyString, EmailString } from "@pagopa/ts-commons/lib/strings";
import { Dossier } from "../../../dossier";
import { DocumentMetadata } from "@io-sign/io-sign/document";
import {
  SignatureRequestRejected,
  SignatureRequestSigned,
} from "@io-sign/io-sign/signature-request";
import { SignerRepository } from "@io-sign/io-sign/signer";
import { FiscalCode } from "../../../infra/http/models/FiscalCode";
import { TelemetryService } from "@io-sign/io-sign/telemetry";
import { NotificationService } from "@io-sign/io-sign/notification";

import { EventName, EventProducerClient } from "@io-sign/io-sign/event";

import { CloseSignatureRequestHandler } from "../../../infra/handlers/close-signature-request";

const issuer: Issuer = {
  id: newId(),
  subscriptionId: newId(),
  email: "issuer.test@mail.pagopa.it" as EmailString,
  description: "issuer used in unit tests" as NonEmptyString,
  internalInstitutionId: newId(),
  environment: "TEST",
  vatNumber: "14711371128" as NonEmptyString,
  department: "dep1" as NonEmptyString,
  status: "ACTIVE",
};

const dossier: Dossier = {
  id: newId(),
  title: "my dossier" as NonEmptyString,
  issuerId: issuer.id,
  createdAt: new Date(),
  updatedAt: new Date(),
  documentsMetadata: [
    {
      title: "doc #1" as NonEmptyString,
      signatureFields: [] as unknown as DocumentMetadata["signatureFields"],
      pdfDocumentMetadata: {
        pages: [],
        formFields: [],
      },
    },
  ],
  supportEmail: issuer.email,
};

const wait: SignatureRequest = {
  id: newId(),
  issuerId: issuer.id,
  issuerEmail: dossier.supportEmail,
  issuerDescription: issuer.description,
  issuerInternalInstitutionId: issuer.internalInstitutionId,
  issuerEnvironment: issuer.environment,
  issuerDepartment: issuer.department,
  signerId: newId(),
  dossierId: newId(),
  dossierTitle: "Richiesta di firma" as NonEmptyString,
  status: "WAIT_FOR_SIGNATURE",
  createdAt: new Date(),
  updatedAt: new Date(),
  expiresAt: new Date(),
  documents: [],
  qrCodeUrl: "https://my-qr-code",
};

const rejected: SignatureRequestRejected = {
  ...wait,
  status: "REJECTED",
  rejectedAt: new Date(),
  rejectReason: "just a test!",
};

const signed: SignatureRequestSigned = {
  ...wait,
  status: "SIGNED",
  signedAt: new Date(),
};

const mocks = {
  fiscalCode: "MRCLCU65L02C320T",
  issuer,
  dossier,
  signatureRequest: { wait, rejected, signed },
};

const { requests, telemetry, notification, analytics } = vi.hoisted(() => ({
  requests: {
    upsert: vi.fn((request: SignatureRequest) => TE.right(request)),
    get: vi.fn((id: SignatureRequest["id"]) => {
      if (id === mocks.signatureRequest.wait.id) {
        return TE.right(O.some(mocks.signatureRequest.wait));
      }
      return TE.right(O.none);
    }),
  },
  telemetry: {
    trackEvent: vi.fn(() => () => void 0),
  },
  notification: {
    submit: vi.fn(() => TE.left(new Error("can't send (but it can fail!)"))),
  },
  analytics: {
    sendBatch: vi.fn(() => Promise.resolve(void 0)),
  },
}));

const signatureRequestRepository: SignatureRequestRepository = {
  get: requests.get,
  upsert: requests.upsert,
  findByDossier: () => Promise.reject(new Error("not implemented")),
  patchDocument: () => TE.left(new Error("not implemented")),
  insert: () => TE.left(new Error("not implemented")),
};

const signerRepository: SignerRepository = {
  getFiscalCodeBySignerId: () =>
    pipe(
      FiscalCode.decode(mocks.fiscalCode),
      TE.fromEither,
      TE.mapLeft(() => new Error("invalid fiscal code"))
    ),
  getSignerByFiscalCode: () => TE.left(new Error("not implemented")),
};

const telemetryService: TelemetryService = {
  trackEvent: telemetry.trackEvent,
};

const notificationService: NotificationService = {
  submit: notification.submit,
};

const eventProducerClient: EventProducerClient = {
  createBatch: () =>
    Promise.resolve({
      tryAdd: () => true,
    }),
  close: () => Promise.resolve(void 0),
  sendBatch: analytics.sendBatch,
};

const closeSignatureRequest = (input: ClosedSignatureRequest) =>
  CloseSignatureRequestHandler({
    signatureRequestRepository,
    signerRepository,
    telemetryService,
    notificationService,
    eventAnalyticsClient: eventProducerClient,
    billingEventProducer: eventProducerClient,
    inputDecoder: ClosedSignatureRequest,
    logger: {
      log: () => () => void 0,
    },
    input,
  });

describe("closeSignatureRequest", () => {
  describe("Given a CLOSED request", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("exits if the signature request is not found", async () => {
      const result = await closeSignatureRequest({
        ...mocks.signatureRequest.signed,
        id: newId(),
      })();
      expect(E.isLeft(result)).toBe(true);
    });

    it("updates the request, then notifiy the signer and send the analytics event", async () => {
      const result = await closeSignatureRequest(
        mocks.signatureRequest.rejected
      )();
      expect(E.isRight(result));
      expect(requests.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: mocks.signatureRequest.rejected.status,
        })
      );
      expect(notification.submit).toHaveBeenCalledWith(
        mocks.fiscalCode,
        expect.objectContaining({
          subject: expect.stringContaining("problema con la firma"),
        })
      );
      expect(analytics.sendBatch).toHaveBeenCalled();
    });
  });

  describe("Given a SIGNED request", () => {
    it("tracks a billing event", async () => {
      const result = await closeSignatureRequest(
        mocks.signatureRequest.signed
      )();
      expect(E.isRight(result));
      expect(analytics.sendBatch).toHaveBeenCalledTimes(2);
    });

    it("fails on error on billing event", async () => {
      analytics.sendBatch.mockRejectedValueOnce(new Error("unexpected!"));
      const result = await closeSignatureRequest(
        mocks.signatureRequest.signed
      )();
      expect(E.isLeft(result));
    });
  });

  describe("Given a REJECTED request", () => {
    it("tracks a REJECTED telemetry event with sampling disabled", async () => {
      const result = await closeSignatureRequest(
        mocks.signatureRequest.rejected
      )();
      expect(E.isRight(result));
      expect(telemetry.trackEvent).toBeCalledWith(
        EventName.SIGNATURE_REJECTED,
        expect.objectContaining({
          properties: {
            signatureRequestId: mocks.signatureRequest.rejected.id,
            environment: "TEST",
          },
        }),
        expect.objectContaining({
          sampling: false,
        })
      );
    });
  });
});
