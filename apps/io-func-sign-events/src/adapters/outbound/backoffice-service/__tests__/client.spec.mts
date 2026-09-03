import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GenericError,
  ServiceUnavailableError
} from "@pagopa/hexagonal-core/domain/errors";

const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("node-fetch", () => ({ default: fetchMock }));

const { makeBackofficeService } = await import("../client.mjs");

const config = { baseUrl: "https://backoffice.example.com/", apiKey: "a-key" };

const anIssuerWebhook = {
  issuerId: "550e8400-e29b-41d4-a716-446655440001",
  url: "https://example.com/webhook",
  privateKeySecretName: "a-secret-name",
  publicKeyThumbprint: "a-thumbprint",
  status: "active"
};

describe("makeBackofficeService", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  describe("checkHealth", () => {
    it("returns ok when the service responds successfully", async () => {
      fetchMock.mockResolvedValue({ ok: true, status: 200 });
      const result = await makeBackofficeService(config).checkHealth();
      expect(result.isOk()).toBe(true);
    });

    it("returns a ServiceUnavailableError when the service responds with an error status", async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 503 });
      const result = await makeBackofficeService(config).checkHealth();
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ServiceUnavailableError);
      expect(result._unsafeUnwrapErr().message).toContain("503");
    });

    it("returns a ServiceUnavailableError when the request throws", async () => {
      fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
      const result = await makeBackofficeService(config).checkHealth();
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().message).toContain("ECONNREFUSED");
    });
  });

  describe("getWebhookForIssuer", () => {
    it("returns the parsed webhook when the service responds successfully", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => anIssuerWebhook
      });
      const result = await makeBackofficeService(config).getWebhookForIssuer(
        anIssuerWebhook.issuerId,
        "550e8400-e29b-41d4-a716-446655440002"
      );
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(anIssuerWebhook);
    });

    it("returns ok(undefined) when the issuer has no webhook (404)", async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 404 });
      const result = await makeBackofficeService(config).getWebhookForIssuer(
        "an-issuer-id",
        "an-institution-id"
      );
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it("returns a GenericError when the service responds with an error status", async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500 });
      const result = await makeBackofficeService(config).getWebhookForIssuer(
        "an-issuer-id",
        "an-institution-id"
      );
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(GenericError);
      expect(result._unsafeUnwrapErr().message).toContain("500");
    });

    it("returns a GenericError when the request throws", async () => {
      fetchMock.mockRejectedValue(new Error("timeout"));
      const result = await makeBackofficeService(config).getWebhookForIssuer(
        "an-issuer-id",
        "an-institution-id"
      );
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(GenericError);
      expect(result._unsafeUnwrapErr().message).toContain("timeout");
    });

    it("returns a GenericError when the response body does not match the webhook schema", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ issuerId: "an-issuer-id" })
      });
      const result = await makeBackofficeService(config).getWebhookForIssuer(
        "an-issuer-id",
        "an-institution-id"
      );
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(GenericError);
      expect(result._unsafeUnwrapErr().message).toContain("invalid webhook");
    });
  });
});
