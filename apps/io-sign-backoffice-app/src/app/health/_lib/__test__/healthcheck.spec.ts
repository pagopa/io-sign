import { describe, test, expect } from "vitest";

import healthcheck from "../healthcheck";

describe("healthcheck", () => {
  test("status=fail when there are failures", async () => {
    expect.assertions(2);
    const health = await healthcheck([
      Promise.reject("will-fail"),
      Promise.resolve(),
    ]);
    expect(health.status).toBe("fail");
    if (health.status === "fail") {
      expect(health.failures).toEqual(["will-fail"]);
    }
  });
  test("status=ok when there are no checks", async () => {
    const health = await healthcheck([]);
    expect(health.status).toBe("ok");
  });
  test("status=ok when all checks succeed", async () => {
    const health = await healthcheck([Promise.resolve(), Promise.resolve()]);
    expect(health.status).toBe("ok");
  });
  test("set unknown as failure reason if a checker does not throw a string", async () => {
    const health = await healthcheck([Promise.reject(new Error("..."))]);
    expect.assertions(1);
    if (health.status === "fail") {
      expect(health.failures).toEqual(["unknown"]);
    }
  });
});
