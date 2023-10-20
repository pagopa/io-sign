import { vi, describe, it, expect } from "vitest";

import { Issuer } from "../issuers";

import {
  getIssuerByInstitution,
  createIssuerIfNotExists,
  replaceSupportEmail,
} from "../issuers/use-cases";

const mocks: { issuer: Issuer } = vi.hoisted(() => ({
  issuer: {
    id: "103920",
    externalId: "01GG4NFBCN4ZH8ETCCKX3766KX",
    institutionId: "8a6031b8-ca40-4ac1-86b6-c3bda65803d7",
    type: "PA",
    supportEmail: "supportEmail@gmail.com",
    state: "active",
  },
}));

const patch = vi.hoisted(() => vi.fn());

const item = vi.hoisted(() =>
  vi.fn((id: string) => ({
    read: async () => ({
      resource: id === mocks.issuer.id ? mocks.issuer : undefined,
    }),
    patch,
  }))
);

const create = vi.hoisted(() => vi.fn().mockResolvedValue({}));

const { getCosmosContainerClient } = vi.hoisted(() => ({
  getCosmosContainerClient: vi.fn().mockReturnValue({
    item,
    items: { create },
  }),
}));

vi.mock("@/lib/cosmos", () => ({
  getCosmosContainerClient,
}));

describe("createIssuerIfNotExists", () => {
  it("should not create an issuer", async () => {
    const payload = {
      id: mocks.issuer.id,
      institutionId: mocks.issuer.institutionId,
      supportEmail: mocks.issuer.supportEmail,
      name: "test",
    };
    await createIssuerIfNotExists(payload);
    expect(create).not.toHaveBeenCalled();
  });
  it("should create an issuer", async () => {
    const payload = {
      id: "not-exists",
      institutionId: mocks.issuer.institutionId,
      supportEmail: mocks.issuer.supportEmail,
      name: "test",
    };
    await createIssuerIfNotExists(payload);
    expect(create).toHaveBeenCalledWith(expect.objectContaining(payload));
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

describe("replaceSupportEmail", () => {
  it("should replaces the supportEmail field", async () => {
    const newEmailAddress = "new.email.address@test.unit.tld";
    await replaceSupportEmail(
      {
        id: mocks.issuer.id,
        institutionId: mocks.issuer.institutionId,
      },
      newEmailAddress
    );
    expect(patch).toHaveBeenCalledWith([
      {
        op: "replace",
        path: "/supportEmail",
        value: newEmailAddress,
      },
    ]);
  });
});
