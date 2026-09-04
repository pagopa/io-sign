import { describe, it, expect, vi } from "vitest";
import type { MockedFunction } from "vitest";
import { ok, err } from "neverthrow";
import { GenericError } from "@pagopa/hexagonal-core/domain/errors";
import type { Logger } from "@pagopa/hexagonal-core/domain/ports";
import { makeSignEventWebhookUseCase } from "../sign-event-webhook.use-case.js";
import type { SignEvent } from "../../../domain/sign-event.js";
import type {
  BackofficeService,
  IssuerWebhook
} from "../../../domain/ports/outbound/backoffice-service.js";
import type { SignEventWebhookQueuePublisher } from "../../../domain/ports/outbound/sign-event-webhook-queue-publisher.js";
import type { WebhookQueueEvent } from "../../../domain/webhook-queue-event.js";

const aSignatureRequestId = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const aDocumentId = "01ARZ3NDEKTSV4RRFFQ69G5FB1";
const anIssuerId = "550e8400-e29b-41d4-a716-446655440001";
const anInstitutionId = "550e8400-e29b-41d4-a716-446655440002";

const aBaseSignatureRequest = {
  id: aSignatureRequestId,
  signerId: "550e8400-e29b-41d4-a716-446655440000",
  issuerId: anIssuerId,
  issuerEmail: "test@example.com",
  issuerDescription: "Test Issuer",
  issuerInternalInstitutionId: anInstitutionId,
  issuerEnvironment: "TEST" as const,
  issuerDepartment: "Test Department",
  dossierId: "01ARZ3NDEKTSV4RRFFQ69G5FAW",
  dossierTitle: "Test Dossier",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  expiresAt: "2024-12-31T00:00:00.000Z"
};

const aDraftSignEvent: SignEvent = {
  eventId: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  eventName: "io.sign.signature_request.created",
  payloadType: "signature_request",
  payload: {
    signatureRequest: { ...aBaseSignatureRequest, status: "DRAFT", documents: [] }
  }
};

const aSignedSignEvent: SignEvent = {
  eventId: "01ARZ3NDEKTSV4RRFFQ69G5FAX",
  eventName: "io.sign.signature_request.signed",
  payloadType: "signature_request",
  payload: {
    signatureRequest: {
      ...aBaseSignatureRequest,
      status: "SIGNED",
      signedAt: "2024-01-02T00:00:00.000Z",
      documents: []
    }
  }
};

const aRejectedSignEvent: SignEvent = {
  eventId: "01ARZ3NDEKTSV4RRFFQ69G5FAY",
  eventName: "io.sign.signature_request.rejected",
  payloadType: "signature_request",
  payload: {
    signatureRequest: {
      ...aBaseSignatureRequest,
      status: "REJECTED",
      rejectedAt: "2024-01-02T00:00:00.000Z",
      rejectReason: "nope",
      qrCodeUrl: "https://example.com/qr",
      documents: []
    }
  }
};

const makeDocumentSignEvent = (
  documents: { id: string; status: string }[],
  documentId = aDocumentId
): SignEvent => ({
  eventId: "01ARZ3NDEKTSV4RRFFQ69G5FAZ",
  eventName: "io.sign.signature_request.document.uploaded",
  payloadType: "signature_request_document",
  payload: {
    signatureRequest: { ...aBaseSignatureRequest, status: "DRAFT", documents },
    documentId
  }
});

const anActiveWebhook: IssuerWebhook = {
  issuerId: anIssuerId,
  url: "https://example.com/webhook",
  privateKeySecretName: "a-secret-name",
  publicKeyThumbprint: "a-thumbprint",
  status: "active"
};

const makeLogger = (): Logger => ({
  debug: vi.fn(),
  error: vi.fn(),
  flush: () => Promise.resolve(),
  info: vi.fn(),
  trackEvent: vi.fn(),
  trackException: vi.fn(),
  warn: vi.fn(),
  with: vi.fn()
});

const makeBackofficeService = (
  overrides?: Partial<BackofficeService>
): BackofficeService => ({
  checkHealth: vi.fn(async () => ok(undefined)),
  getWebhookForIssuer: vi.fn(async () => ok(anActiveWebhook)),
  ...overrides
});

const makeWebhookQueuePublisher = (
  overrides?: Partial<SignEventWebhookQueuePublisher>
): SignEventWebhookQueuePublisher => ({
  checkHealth: vi.fn(async () => ok(undefined)),
  enqueue: vi.fn(async () => ok(undefined)),
  ...overrides
});

const ulidRegex = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;

const enqueueMock = (publisher: SignEventWebhookQueuePublisher) =>
  publisher.enqueue as unknown as MockedFunction<
    (event: WebhookQueueEvent) => Promise<unknown>
  >;

describe("makeSignEventWebhookUseCase", () => {
  it("looks up the webhook using the issuer and institution of the event", async () => {
    const backofficeService = makeBackofficeService();
    const useCase = makeSignEventWebhookUseCase({
      logger: makeLogger(),
      backofficeService,
      webhookQueuePublisher: makeWebhookQueuePublisher()
    });
    await useCase(aSignedSignEvent);
    expect(backofficeService.getWebhookForIssuer).toHaveBeenCalledWith(
      anIssuerId,
      anInstitutionId
    );
  });

  it("returns err when the webhook lookup fails", async () => {
    const anError = new GenericError("backoffice-service returned 500");
    const webhookQueuePublisher = makeWebhookQueuePublisher();
    const useCase = makeSignEventWebhookUseCase({
      logger: makeLogger(),
      backofficeService: makeBackofficeService({
        getWebhookForIssuer: vi.fn(async () => err(anError))
      }),
      webhookQueuePublisher
    });
    const result = await useCase(aSignedSignEvent);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe(anError);
    expect(webhookQueuePublisher.enqueue).not.toHaveBeenCalled();
  });

  it("returns err when the enqueue fails", async () => {
    const anError = new GenericError("failed to enqueue webhook queue event");
    const useCase = makeSignEventWebhookUseCase({
      logger: makeLogger(),
      backofficeService: makeBackofficeService(),
      webhookQueuePublisher: makeWebhookQueuePublisher({
        enqueue: vi.fn(async () => err(anError))
      })
    });
    const result = await useCase(aSignedSignEvent);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe(anError);
  });

  it("does not enqueue when the issuer has no webhook configured", async () => {
    const webhookQueuePublisher = makeWebhookQueuePublisher();
    const useCase = makeSignEventWebhookUseCase({
      logger: makeLogger(),
      backofficeService: makeBackofficeService({
        getWebhookForIssuer: vi.fn(async () => ok(undefined))
      }),
      webhookQueuePublisher
    });
    const result = await useCase(aSignedSignEvent);
    expect(result.isOk()).toBe(true);
    expect(webhookQueuePublisher.enqueue).not.toHaveBeenCalled();
  });

  it("does not enqueue when the issuer webhook is inactive", async () => {
    const webhookQueuePublisher = makeWebhookQueuePublisher();
    const useCase = makeSignEventWebhookUseCase({
      logger: makeLogger(),
      backofficeService: makeBackofficeService({
        getWebhookForIssuer: vi.fn(async () =>
          ok({ ...anActiveWebhook, status: "inactive" as const })
        )
      }),
      webhookQueuePublisher
    });
    const result = await useCase(aSignedSignEvent);
    expect(result.isOk()).toBe(true);
    expect(webhookQueuePublisher.enqueue).not.toHaveBeenCalled();
  });

  it("does not enqueue for a signature request status that is not SIGNED or REJECTED", async () => {
    const webhookQueuePublisher = makeWebhookQueuePublisher();
    const useCase = makeSignEventWebhookUseCase({
      logger: makeLogger(),
      backofficeService: makeBackofficeService(),
      webhookQueuePublisher
    });
    const result = await useCase(aDraftSignEvent);
    expect(result.isOk()).toBe(true);
    expect(webhookQueuePublisher.enqueue).not.toHaveBeenCalled();
  });

  it("does not enqueue when the document referenced by the event is missing", async () => {
    const webhookQueuePublisher = makeWebhookQueuePublisher();
    const useCase = makeSignEventWebhookUseCase({
      logger: makeLogger(),
      backofficeService: makeBackofficeService(),
      webhookQueuePublisher
    });
    const result = await useCase(makeDocumentSignEvent([]));
    expect(result.isOk()).toBe(true);
    expect(webhookQueuePublisher.enqueue).not.toHaveBeenCalled();
  });

  it("does not enqueue for a document status that is not READY or REJECTED", async () => {
    const webhookQueuePublisher = makeWebhookQueuePublisher();
    const useCase = makeSignEventWebhookUseCase({
      logger: makeLogger(),
      backofficeService: makeBackofficeService(),
      webhookQueuePublisher
    });
    const result = await useCase(
      makeDocumentSignEvent([{ id: aDocumentId, status: "WAIT_FOR_UPLOAD" }])
    );
    expect(result.isOk()).toBe(true);
    expect(webhookQueuePublisher.enqueue).not.toHaveBeenCalled();
  });

  it.each(["SIGNED", "REJECTED"] as const)(
    "enqueues a signature request status update event for status %s",
    async (status) => {
      const webhookQueuePublisher = makeWebhookQueuePublisher();
      const useCase = makeSignEventWebhookUseCase({
        logger: makeLogger(),
        backofficeService: makeBackofficeService(),
        webhookQueuePublisher
      });
      const result = await useCase(
        status === "SIGNED" ? aSignedSignEvent : aRejectedSignEvent
      );
      expect(result.isOk()).toBe(true);
      expect(webhookQueuePublisher.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(ulidRegex),
          retryCount: 0,
          webhookUrl: anActiveWebhook.url,
          webhookPrivateKeySecretName: anActiveWebhook.privateKeySecretName,
          webhookPublicKeyThumbprint: anActiveWebhook.publicKeyThumbprint,
          webhookEvent: expect.objectContaining({
            eventId: expect.stringMatching(ulidRegex),
            eventType: "signature-request.status.update",
            payload: {
              signatureRequestId: aSignatureRequestId,
              status
            }
          })
        })
      );
      const [queueEvent] = enqueueMock(webhookQueuePublisher).mock.calls[0];
      expect(queueEvent.id).toBe(queueEvent.webhookEvent.eventId);
    }
  );

  it.each(["READY", "REJECTED"] as const)(
    "enqueues a document status update event for status %s",
    async (documentStatus) => {
      const webhookQueuePublisher = makeWebhookQueuePublisher();
      const useCase = makeSignEventWebhookUseCase({
        logger: makeLogger(),
        backofficeService: makeBackofficeService(),
        webhookQueuePublisher
      });
      const result = await useCase(
        makeDocumentSignEvent([{ id: aDocumentId, status: documentStatus }])
      );
      expect(result.isOk()).toBe(true);
      expect(webhookQueuePublisher.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(ulidRegex),
          webhookEvent: expect.objectContaining({
            eventId: expect.stringMatching(ulidRegex),
            eventType: "signature-request.document.status.update",
            payload: {
              signatureRequestId: aSignatureRequestId,
              documentId: aDocumentId,
              documentStatus
            }
          })
        })
      );
      const [queueEvent] = enqueueMock(webhookQueuePublisher).mock.calls[0];
      expect(queueEvent.id).toBe(queueEvent.webhookEvent.eventId);
    }
  );

  it("generates a different event id for each enqueued event", async () => {
    const webhookQueuePublisher = makeWebhookQueuePublisher();
    const useCase = makeSignEventWebhookUseCase({
      logger: makeLogger(),
      backofficeService: makeBackofficeService(),
      webhookQueuePublisher
    });
    await useCase(aSignedSignEvent);
    await useCase(aSignedSignEvent);
    const [[first], [second]] = enqueueMock(webhookQueuePublisher).mock.calls;
    expect(first.id).not.toBe(second.id);
  });
});
