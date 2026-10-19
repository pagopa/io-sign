import { describe, expect, it, vi, afterEach } from "vitest";

import * as L from "@pagopa/logger";
import * as H from "@pagopa/handler-kit";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/function";

import { newId } from "@io-sign/io-sign/id";
import {
  NotificationNotAllowedError,
  TooManyRequestsError
} from "@io-sign/io-sign/error";
import { Notification, NotificationService } from "@io-sign/io-sign/notification";
import { SignerRepository } from "@io-sign/io-sign/signer";
import {
  SignatureRequestRejected,
  SignatureRequestSigned
} from "@io-sign/io-sign/signature-request";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { SendOutcomeNotificationHandler } from "../send-outcome-notification";
import {
  SignatureRequest,
  SignatureRequestRepository
} from "../../../../signature-request";
import { FiscalCode } from "../../models/FiscalCode";

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
  id: newId(),
  status: "SIGNED",
  signedAt: new Date()
};

const rejected: SignatureRequestRejected = {
  ...wait,
  id: newId(),
  status: "REJECTED",
  rejectedAt: new Date(),
  rejectReason: "just a test!"
};

const alreadySent: SignatureRequestSigned = {
  ...signed,
  id: newId(),
  outcomeNotification: { ioMessageId: "old-message-id" as NonEmptyString }
};

const requests = [wait, signed, rejected, alreadySent];

const sentNotification: Notification = {
  ioMessageId: "new-message-id" as NonEmptyString
};

const { repository, notification } = vi.hoisted(() => ({
  repository: {
    upsert: vi.fn(),
    getById: vi.fn()
  },
  notification: {
    submit: vi.fn()
  }
}));

const signatureRequestRepository: SignatureRequestRepository = {
  getById: repository.getById,
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
  log: () => () => {},
  format: L.format.simple
};

const sendOutcomeNotification = (path: Record<string, string>) =>
  SendOutcomeNotificationHandler({
    logger,
    signatureRequestRepository,
    signerRepository,
    notificationService,
    input: { ...H.request("https://api.test.it/"), path },
    inputDecoder: H.HttpRequest
  })();

const withDefaultMocks = () => {
  repository.getById.mockImplementation((id: SignatureRequest["id"]) =>
    TE.right(O.fromNullable(requests.find((r) => r.id === id)))
  );
  repository.upsert.mockImplementation((request: SignatureRequest) =>
    TE.right(request)
  );
  notification.submit.mockImplementation(() => TE.right(sentNotification));
};

describe("SendOutcomeNotificationHandler", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should return 400 when the signature request id is missing", async () => {
    withDefaultMocks();
    const result = await sendOutcomeNotification({});
    expect(result).toEqual(
      expect.objectContaining({
        right: expect.objectContaining({ statusCode: 400 })
      })
    );
    expect(notification.submit).not.toHaveBeenCalled();
  });

  it("should return 404 when the signature request is not found", async () => {
    withDefaultMocks();
    const result = await sendOutcomeNotification({
      signatureRequestId: newId()
    });
    expect(result).toEqual(
      expect.objectContaining({
        right: expect.objectContaining({ statusCode: 404 })
      })
    );
    expect(notification.submit).not.toHaveBeenCalled();
  });

  it("should return 400 when the signature request is not SIGNED or REJECTED", async () => {
    withDefaultMocks();
    const result = await sendOutcomeNotification({
      signatureRequestId: wait.id
    });
    expect(result).toEqual(
      expect.objectContaining({
        right: expect.objectContaining({ statusCode: 400 })
      })
    );
    expect(notification.submit).not.toHaveBeenCalled();
  });

  it("should return 400 when the outcome notification has already been sent", async () => {
    withDefaultMocks();
    const result = await sendOutcomeNotification({
      signatureRequestId: alreadySent.id
    });
    expect(result).toEqual(
      expect.objectContaining({
        right: expect.objectContaining({ statusCode: 400 })
      })
    );
    expect(notification.submit).not.toHaveBeenCalled();
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it("should return 403 when the citizen is not enabled to receive messages", async () => {
    withDefaultMocks();
    notification.submit.mockImplementation(() =>
      TE.left(
        new NotificationNotAllowedError(
          "It is not allowed to send a message to this user."
        )
      )
    );
    const result = await sendOutcomeNotification({
      signatureRequestId: signed.id
    });
    expect(result).toEqual(
      expect.objectContaining({
        right: expect.objectContaining({ statusCode: 403 })
      })
    );
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it("should return 429 when external api responds with too many requests", async () => {
    withDefaultMocks();
    notification.submit.mockImplementation(() =>
      TE.left(new TooManyRequestsError("Too many requests!"))
    );
    const result = await sendOutcomeNotification({
      signatureRequestId: signed.id
    });
    expect(result).toEqual(
      expect.objectContaining({
        right: expect.objectContaining({ statusCode: 429 })
      })
    );
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it("should return 500 when the outcome notification can't be saved", async () => {
    withDefaultMocks();
    repository.upsert.mockImplementation(() =>
      TE.left(new Error("unable to upsert"))
    );
    const result = await sendOutcomeNotification({
      signatureRequestId: signed.id
    });
    expect(result).toEqual(
      expect.objectContaining({
        right: expect.objectContaining({ statusCode: 500 })
      })
    );
  });

  it.each([
    ["SIGNED", signed],
    ["REJECTED", rejected]
  ])(
    "should send the notification, save it and return 200 for a %s request",
    async (_, request) => {
      withDefaultMocks();
      const result = await sendOutcomeNotification({
        signatureRequestId: request.id
      });
      expect(result).toEqual(
        expect.objectContaining({
          right: expect.objectContaining({
            statusCode: 200,
            body: { io_message_id: sentNotification.ioMessageId }
          })
        })
      );
      expect(notification.submit).toHaveBeenCalledOnce();
      expect(repository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: request.id,
          outcomeNotification: sentNotification
        })
      );
    }
  );
});
