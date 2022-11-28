import { describe, it, expect } from "vitest";

import { makeInfoFunction } from "../info";

describe("info", () => {
  it("should return a successful response", async () => {
    const info = makeInfoFunction();
    const { statusCode } = await info();
    expect(statusCode).toBe(200);
  });
});
