import { describe, it, expect, vi } from "vitest";
import { ok, err } from "neverthrow";
import { GenericError } from "@pagopa/hexagonal-core/domain/errors";
import type { Logger } from "@pagopa/hexagonal-core/domain/ports";
import { makeSignEventPDNDUseCase } from "../sign-event-pdnd.use-case.js";
import type { SignEvent } from "../../../domain/sign-event.js";
import type { SignEventPDNDPublisher } from "../../../domain/ports/outbound/sign-event-pdnd-publisher.js";

const aBasePayload = {
  id: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  status: "DRAFT" as const,
  signerId: "550e8400-e29b-41d4-a716-446655440000",
  issuerId: "550e8400-e29b-41d4-a716-446655440001",
  issuerEmail: "test@example.com",
  issuerDescription: "Test Issuer",
  issuerInternalInstitutionId: "550e8400-e29b-41d4-a716-446655440002",
  issuerEnvironment: "TEST" as const,
  issuerDepartment: "Test Department",
  dossierId: "01ARZ3NDEKTSV4RRFFQ69G5FAW",
  dossierTitle: "Test Dossier",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  expiresAt: "2024-12-31T00:00:00.000Z",
  documents: []
};

const aCreatedSignEvent: SignEvent = {
  eventId: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  eventName: "io.sign.signature_request.created",
  payloadType: "signature_request",
  payload: aBasePayload
};

const aSignedSignEvent: SignEvent = {
  eventId: "01ARZ3NDEKTSV4RRFFQ69G5FAX",
  eventName: "io.sign.signature_request.signed",
  payloadType: "signature_request",
  payload: { ...aBasePayload, status: "SIGNED" as const }
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

const makePdndPublisher = (overrides?: Partial<SignEventPDNDPublisher>): SignEventPDNDPublisher => ({
  checkHealth: vi.fn(async () => ok(undefined)),
  sendAnalyticsEvent: vi.fn(async () => ok(undefined)),
  sendBillingEvent: vi.fn(async () => ok(undefined)),
  ...overrides
});

describe("makeSignEventPDNDUseCase", () => {
  it("sends an analytics event for events in the PDND analytics set", async () => {
    const pdndPublisher = makePdndPublisher();
    const useCase = makeSignEventPDNDUseCase({ logger: makeLogger(), pdndPublisher });
    const result = await useCase(aCreatedSignEvent);
    expect(result.isOk()).toBe(true);
    expect(pdndPublisher.sendAnalyticsEvent).toHaveBeenCalledOnce();
    expect(pdndPublisher.sendBillingEvent).not.toHaveBeenCalled();
  });

  it("sends both analytics and billing events for a signed event", async () => {
    const pdndPublisher = makePdndPublisher();
    const useCase = makeSignEventPDNDUseCase({ logger: makeLogger(), pdndPublisher });
    const result = await useCase(aSignedSignEvent);
    expect(result.isOk()).toBe(true);
    expect(pdndPublisher.sendAnalyticsEvent).toHaveBeenCalledOnce();
    expect(pdndPublisher.sendBillingEvent).toHaveBeenCalledOnce();
  });

  it("skips both publishers for events outside the PDND analytics set", async () => {
    const waitForSignatureEvent: SignEvent = {
      eventId: "01ARZ3NDEKTSV4RRFFQ69G5FAY",
      eventName: "io.sign.signature_request.wait_for_signature",
      payloadType: "signature_request",
      payload: { ...aBasePayload, status: "WAIT_FOR_SIGNATURE" as const }
    };
    const pdndPublisher = makePdndPublisher();
    const useCase = makeSignEventPDNDUseCase({ logger: makeLogger(), pdndPublisher });
    const result = await useCase(waitForSignatureEvent);
    expect(result.isOk()).toBe(true);
    expect(pdndPublisher.sendAnalyticsEvent).not.toHaveBeenCalled();
    expect(pdndPublisher.sendBillingEvent).not.toHaveBeenCalled();
  });

  it("maps issuerEnvironment TEST to FREE pricingPlan", async () => {
    const pdndPublisher = makePdndPublisher();
    const useCase = makeSignEventPDNDUseCase({ logger: makeLogger(), pdndPublisher });
    await useCase(aCreatedSignEvent);
    const [analyticsEvent] = vi.mocked(pdndPublisher.sendAnalyticsEvent).mock.calls[0];
    expect(analyticsEvent.pricingPlan).toBe("FREE");
  });

  it("returns err when sendAnalyticsEvent fails", async () => {
    const pdndPublisher = makePdndPublisher({
      sendAnalyticsEvent: vi.fn(async () => err(new GenericError("hub down")))
    });
    const useCase = makeSignEventPDNDUseCase({ logger: makeLogger(), pdndPublisher });
    const result = await useCase(aCreatedSignEvent);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain("hub down");
  });

  it("returns err when sendBillingEvent fails and does not proceed", async () => {
    const pdndPublisher = makePdndPublisher({
      sendBillingEvent: vi.fn(async () => err(new GenericError("billing hub down")))
    });
    const useCase = makeSignEventPDNDUseCase({ logger: makeLogger(), pdndPublisher });
    const result = await useCase(aSignedSignEvent);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain("billing hub down");
  });
});
