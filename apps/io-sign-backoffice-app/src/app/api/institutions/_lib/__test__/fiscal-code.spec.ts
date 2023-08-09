import { vi, describe, it, expect } from "vitest";
import { listFiscalCodes } from "../fiscal-code";

const mocks = vi.hoisted(() => ({
  test_fiscal_codes: ["CRLSLV94D55H501J", "ZLLDNL91E17H501L"],
}));

const { getCosmosConfig, getCosmosContainerClient } = vi.hoisted(() => ({
  getCosmosConfig: vi.fn().mockReturnValue({
    cosmosContainerName: "cosmosContainerName",
  }),
  getCosmosContainerClient: vi.fn().mockReturnValue({
    item: vi.fn().mockReturnValue({
      read: vi.fn().mockResolvedValue({
        resource: mocks,
      }),
    }),
  }),
}));

vi.mock("@/lib/cosmos", () => ({
  getCosmosConfig,
  getCosmosContainerClient,
}));

describe("listFiscalCodes", () => {
  it("should return an empty list", () => {
    getCosmosContainerClient.mockReturnValueOnce({
      item: vi.fn().mockReturnValue({
        read: vi.fn().mockResolvedValue({
          resource: {
            test_fiscal_codes: [],
          },
        }),
      }),
    });

    expect(listFiscalCodes("apiKeyId", "institutionId")).resolves.toEqual({
      fiscalCodes: [],
    });
  });

  it("should return a fiscal codes list", () => {
    expect(listFiscalCodes("apiKeyId", "institutionId")).resolves.toEqual({
      fiscalCodes: mocks.test_fiscal_codes,
    });
  });
});
