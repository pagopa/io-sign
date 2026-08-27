import { describe, it, expect, vi } from "vitest";
import type { Logger } from "@pagopa/hexagonal-core/domain/ports";
import { makeSignEventPDNDUseCase } from "../sign-event-pdnd.use-case.js";
import type { SignEvent } from "../../../domain/sign-event.js";

const aSignEvent: SignEvent = {
  eventId: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  eventName: "io.sign.signature_request.created",
  payloadType: "signature_request",
  payload: {
    id: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    status: "DRAFT",
    signerId: "550e8400-e29b-41d4-a716-446655440000",
    issuerId: "550e8400-e29b-41d4-a716-446655440001",
    issuerEmail: "test@example.com",
    issuerDescription: "Test Issuer",
    issuerInternalInstitutionId: "550e8400-e29b-41d4-a716-446655440002",
    issuerEnvironment: "TEST",
    issuerDepartment: "Test Department",
    dossierId: "01ARZ3NDEKTSV4RRFFQ69G5FAW",
    dossierTitle: "Test Dossier",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    expiresAt: "2024-12-31T00:00:00.000Z",
    documents: []
  }
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

describe("makeSignEventPDNDUseCase", () => {
  it("returns ok(undefined) for any sign event", async () => {
    const logger = makeLogger();
    const useCase = makeSignEventPDNDUseCase({ logger });
    const result = await useCase(aSignEvent);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBeUndefined();
  });

  it("logs the event with the correct message and properties", async () => {
    const logger = makeLogger();
    const useCase = makeSignEventPDNDUseCase({ logger });
    await useCase(aSignEvent);
    expect(logger.info).toHaveBeenCalledWith(
      "sign event received by trigger for pdnd",
      expect.objectContaining({
        eventName: aSignEvent.eventName,
        payloadType: aSignEvent.payloadType
      })
    );
  });
});
