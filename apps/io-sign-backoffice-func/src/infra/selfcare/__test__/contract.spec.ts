import { describe, it, expect } from "vitest";
import { ioSignContracts } from "../contract";

const validActiveContract = {
  id: "contract-1",
  internalIstitutionID: "inst-123",
  state: "ACTIVE",
  institution: {
    address: "Via Roma 1",
    description: "Comune di Test",
    digitalAddress: "comune.test@pec.it",
    taxCode: "TAXCODE01"
  },
  billing: { vatNumber: "12345678901" },
  product: "prod-io-sign"
};

const validClosedContract = {
  ...validActiveContract,
  id: "contract-2",
  state: "CLOSED"
};

describe("ioSignContracts", () => {
  it("should parse an array of valid ACTIVE contracts", () => {
    const result = ioSignContracts.safeParse([validActiveContract]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].state).toBe("ACTIVE");
    }
  });

  it("should parse an array of valid CLOSED contracts", () => {
    const result = ioSignContracts.safeParse([validClosedContract]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].state).toBe("CLOSED");
    }
  });

  it("should silently filter out contracts belonging to a different product", () => {
    const otherProductContract = { ...validActiveContract, product: "prod-pn" };
    const result = ioSignContracts.safeParse([otherProductContract]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });

  it("should silently filter out malformed contracts", () => {
    const malformed = { id: "x", state: "ACTIVE", product: "prod-io-sign" };
    const result = ioSignContracts.safeParse([malformed]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });

  it("should keep only prod-io-sign contracts from a mixed array", () => {
    const input = [
      validActiveContract,
      { ...validActiveContract, product: "prod-pn" },
      validClosedContract,
      { id: "bad" }
    ];
    const result = ioSignContracts.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data.every((c) => c.product === "prod-io-sign")).toBe(true);
    }
  });

  it("should return an empty array when given an empty array", () => {
    const result = ioSignContracts.safeParse([]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });

  it("should fail when the input is not an array", () => {
    const result = ioSignContracts.safeParse({ foo: "bar" });
    expect(result.success).toBe(false);
  });
});
