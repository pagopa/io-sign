import { vi, describe, it, expect } from "vitest";
import { parseValue } from "../api-key";
import { z } from "zod";

describe("parseValue", () => {
  it("should throw a ZodError - path: /test_fiscal_codes", () => {
    expect(() => {
      parseValue("/test_fiscal_codes", ["foo", "bar"]);
    }).toThrowError(z.ZodError);
  });

  it("should not throw a ZodError - path: /test_fiscal_codes", () => {
    expect(() => {
      parseValue("/test_fiscal_codes", [
        "CRLSLV94D55H501J",
        "ZLLDNL91E17H501L",
      ]);
    }).not.toThrowError();
  });

  it("should throw a ZodError - path: /cidrs", () => {
    expect(() => {
      parseValue("/cidrs", ["foo", "bar"]);
    }).toThrowError(z.ZodError);
  });

  it("should not throw a ZodError - path: /cidrs", () => {
    expect(() => {
      parseValue("/cidrs", ["131.175.148.31/24", "131.175.148.32/24"]);
    }).not.toThrowError();
  });
});
