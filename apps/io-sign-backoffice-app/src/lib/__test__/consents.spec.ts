import { vi, describe, it, expect } from "vitest";

import { checkTOSAcceptance } from "../consents/use-cases";
import { getTOSAcceptance, insertTOSAcceptance } from "../consents/cosmos";

const itemsCreate = vi.hoisted(() => vi.fn().mockResolvedValue({}));

const { getCosmosContainerClient } = vi.hoisted(() => ({
  getCosmosContainerClient: vi.fn().mockReturnValue({
    item: (id: string) => ({
      read: async () => ({ resource: id === "accepted" ? {} : undefined }),
    }),
    items: { create: itemsCreate },
  }),
}));

vi.mock("@/lib/cosmos", () => ({
  getCosmosContainerClient,
}));

vi.mock("@/lib/auth/use-cases", () => ({
  getLoggedUser: vi.fn().mockResolvedValue({ id: "not_accepted" }),
}));

describe("getTOSAcceptance", () => {
  it("should return true if the user agreed to TOS, false otherwise", async () => {
    const result = await Promise.all([
      getTOSAcceptance("accepted", "institution"),
      getTOSAcceptance("not_accepted", "institution"),
    ]);
    expect(result).toEqual([true, false]);
  });
});

describe("insertTOSAcceptance", () => {
  it("should persist the acceptance", async () => {
    await insertTOSAcceptance("user", "institution");
    expect(itemsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user",
        institutionId: "institution",
      })
    );
  });
});

describe("checkTOSAcceptance", () => {
  it("should rejects if the user has not accepted the TOS", () => {
    expect(() => checkTOSAcceptance("institution")).rejects.toBeInstanceOf(
      Error
    );
  });
});
