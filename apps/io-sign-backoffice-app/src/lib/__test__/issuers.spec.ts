import { vi, describe, it, expect } from "vitest";

import { Issuer } from "../issuers";
import { getIssuer } from "../issuers/cosmos";

const mocks: { issuers: Array<Issuer> } = vi.hoisted(() => ({
  issuers: [
    {
      id: "01GG4NFBCN4ZH8ETCCKX3766KX",
      institutionId: "8a6031b8-ca40-4ac1-86b6-c3bda65803d7",
      type: "PA",
      supportEmail: "supportEmail@gmail.com",
    },
  ],
}));

const { getCosmosContainerClient } = vi.hoisted(() => ({
  getCosmosContainerClient: vi.fn().mockReturnValue({
    items: {
      query: vi.fn(() => ({
        fetchAll: vi.fn().mockResolvedValue({
          resources: mocks.issuers,
        }),
      })),
    },
  }),
}));

vi.mock("@/lib/cosmos", () => ({
  getCosmosContainerClient,
}));

describe("getIssuer", () => {
  it("should return issuer", async () => {
    expect(getIssuer("institutionId")).resolves.toEqual(mocks.issuers[0]);
  });
});
