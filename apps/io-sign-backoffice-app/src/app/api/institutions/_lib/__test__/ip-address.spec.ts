import { vi, describe, it, expect } from "vitest";
import { listIpAddresses } from "../ip-address";

const mocks = vi.hoisted(() => ({
  cidrs: ["131.175.148.31/24", "131.175.148.32/24"],
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

describe("listIpAddresses", () => {
  it("should return an empty list", () => {
    getCosmosContainerClient.mockReturnValueOnce({
      item: vi.fn().mockReturnValue({
        read: vi.fn().mockResolvedValue({
          resource: {
            cidrs: [],
          },
        }),
      }),
    });

    expect(listIpAddresses("apiKeyId", "institutionId")).resolves.toEqual({
      cidrs: [],
    });
  });

  it("should return an IP addresses list", () => {
    expect(listIpAddresses("apiKeyId", "institutionId")).resolves.toEqual({
      cidrs: mocks.cidrs,
    });
  });
});
