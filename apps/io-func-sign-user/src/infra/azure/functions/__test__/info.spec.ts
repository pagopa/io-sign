import { describe, it, expect } from "vitest";

import { run } from "../info";

describe("info", () => {
  it("should return a successful response", async () => {
    const { statusCode } = await run();
    expect(statusCode).toBe(200);
  });
});
