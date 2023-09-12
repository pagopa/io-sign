import { vi, describe, it, expect } from "vitest";
import { z } from "zod";

import { Issuer } from "../issuers";
import { getIssuerByInstitution, createIssuer } from "../issuers/use-cases";

const mocks: { issuer: Issuer } = vi.hoisted(() => ({
  issuer: {
    id: "103920",
    externalId: "01GG4NFBCN4ZH8ETCCKX3766KX",
    institutionId: "8a6031b8-ca40-4ac1-86b6-c3bda65803d7",
    type: "PA",
    supportEmail: "supportEmail@gmail.com",
  },
}));

const { getCosmosContainerClient } = vi.hoisted(() => ({
  getCosmosContainerClient: vi.fn().mockReturnValue({
    item: vi.fn().mockReturnValue({
      read: vi.fn().mockResolvedValue({ resource: mocks.issuer }),
    }),
    items: { create: vi.fn().mockResolvedValue({}) },
  }),
}));

vi.mock("@/lib/cosmos", () => ({
  getCosmosContainerClient,
}));

describe("createIssuer", () => {
  it("should create an issuer", async () => {
    const payload = {
      id: mocks.issuer.id,
      institutionId: mocks.issuer.institutionId,
      supportEmail: mocks.issuer.supportEmail,
    };
    const issuer = await createIssuer(payload);
    expect(issuer).toEqual(
      expect.objectContaining({
        ...payload,
        type: "PA",
        externalId: expect.any(String),
      })
    );
    const result = z.string().ulid().safeParse(issuer.externalId);
    expect(result.success).toBe(true);
  });
});

describe("getIssuer", () => {
  it("should return issuer", async () => {
    expect(
      getIssuerByInstitution({
        id: mocks.issuer.institutionId,
        taxCode: mocks.issuer.id,
      })
    ).resolves.toEqual(mocks.issuer);
  });
});
