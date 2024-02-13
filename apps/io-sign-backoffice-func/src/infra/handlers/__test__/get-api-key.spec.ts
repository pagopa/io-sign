import { describe, expect, it, vi } from "vitest";

import * as H from "@pagopa/handler-kit";
import { getApiKeyHandler } from "../get-api-key";
import { InstitutionRepository } from "@/institution";
import { Issuer, IssuerRepository } from "@/issuer";
import { ApiKeyRepository } from "@/api-key";
import { InstitutionDetail } from "@io-sign/io-sign/institution";
import { ApiKey } from "@io-sign/io-sign/api-key";

const logger = {
  log: () => () => {},
};

const institution: InstitutionDetail = {
  id: "001",
  name: "institution name",
  supportEmail: "inst0@test.pagopa.it",
  taxCode: "000",
  vatNumber: "111",
};

const apiKey: ApiKey = {
  displayName: "test key",
  cidrs: [],
  testers: [],
  environment: "test",
  institutionId: institution.id,
  status: "active",
  createdAt: new Date(),
  id: "my-api-key",
};

const issuer: Issuer = {
  id: institution.taxCode,
  status: "active",
  type: "PA",
  institutionId: institution.id,
  externalId: "id-for-external-users",
  supportEmail: institution.supportEmail,
};

const mocks = {
  institution,
  apiKey,
  issuer,
};

const testRepository: IssuerRepository &
  InstitutionRepository &
  ApiKeyRepository = {
  getIssuerByKey: async (k) =>
    k.id === mocks.issuer.id && k.institutionId === mocks.institution.id
      ? mocks.issuer
      : undefined,
  getInstitutionById: async (id) =>
    id === mocks.institution.id ? mocks.institution : undefined,
  getApiKeyById: vi.fn(async (id) =>
    id === mocks.apiKey.id ? mocks.apiKey : undefined
  ),
};

const invokeHandler = (req: H.HttpRequest) =>
  getApiKeyHandler({
    logger,
    input: req,
    inputDecoder: H.HttpRequest,
    institutionRepository: testRepository,
    issuerRepository: testRepository,
    apiKeyRepository: testRepository,
  })();

describe("getApiKey", () => {
  it("should return a 422 HTTP response on invalid path param", () => {
    const req: H.HttpRequest = {
      ...H.request("http://localhost/api-keys/"),
      path: {
        id: "",
      },
    };
    const result = invokeHandler(req);
    expect(result).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 422,
        }),
      })
    );
  });

  it("should return a 404 HTTP response on Api Key not found", () => {
    const req: H.HttpRequest = {
      ...H.request("http://localhost/api-keys/"),
      path: {
        id: "api-key-that-does-not-exists",
      },
    };
    const result = invokeHandler(req);
    expect(result).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 404,
        }),
      })
    );
  });

  it("should return a 404 HTTP response on Institution not found", () => {
    vi.spyOn(testRepository, "getInstitutionById").mockResolvedValueOnce(
      undefined
    );
    const req: H.HttpRequest = {
      ...H.request("http://localhost/api-keys/"),
      path: {
        id: mocks.apiKey.id,
      },
    };
    const result = invokeHandler(req);
    expect(result).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 404,
        }),
      })
    );
  });

  it("should return a 404 HTTP response on Issuer not found", () => {
    vi.spyOn(testRepository, "getIssuerByKey").mockResolvedValueOnce(undefined);
    const req: H.HttpRequest = {
      ...H.request("http://localhost/api-keys/"),
      path: {
        id: mocks.apiKey.id,
      },
    };
    const result = invokeHandler(req);
    expect(result).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 404,
        }),
      })
    );
  });

  it("should return 200 HTTP response with issuer, institution and apiKey if they are found", () => {
    const req: H.HttpRequest = {
      ...H.request("http://localhost/api-keys/"),
      path: {
        id: mocks.apiKey.id,
      },
    };
    const result = invokeHandler(req);
    expect(result).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 200,
          body: {
            ...mocks.apiKey,
            institution: mocks.institution,
            issuer: mocks.issuer,
          },
        }),
      })
    );
  });

  it("should return 500 HTTP response on unhandled exception", () => {
    vi.spyOn(testRepository, "getIssuerByKey").mockRejectedValueOnce(
      new Error("a generic blocking error")
    );
    const req: H.HttpRequest = {
      ...H.request("http://localhost/api-keys/"),
      path: {
        id: mocks.apiKey.id,
      },
    };
    const result = invokeHandler(req);
    expect(result).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 500,
        }),
      })
    );
  });
});
