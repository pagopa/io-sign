import { describe, it, expect, vi } from "vitest";
import { ok, err } from "neverthrow";
import { ServiceUnavailableError } from "@pagopa/hexagonal-core/domain/errors";
import { makeInfoUseCase } from "../info.use-case.js";
import type { SignEventsHub } from "../../ports/sign-events-hub.js";
import type { BackofficeFunc } from "../../ports/backoffice-func.js";
import type { Logger } from "@pagopa/hexagonal-core/domain/ports";

const noop = () => {};
const logger: Logger = { log: noop, debug: noop, info: noop, warn: noop, error: noop };

const hubOk: SignEventsHub = { checkHealth: async () => ok(undefined) };
const backofficeOk: BackofficeFunc = { checkHealth: async () => ok(undefined) };

const hubKo: SignEventsHub = {
  checkHealth: async () => err(new ServiceUnavailableError("hub down"))
};
const backofficeKo: BackofficeFunc = {
  checkHealth: async () => err(new ServiceUnavailableError("backoffice down"))
};

describe("makeInfoUseCase", () => {
  it("returns ok with all health checks green", async () => {
    const useCase = makeInfoUseCase({ logger, signEventsHub: hubOk, backofficeFunc: backofficeOk });
    const result = await useCase({ query: "" });
    expect(result.isOk()).toBe(true);
    const value = result._unsafeUnwrap();
    expect(value.health.signEventsHub).toEqual({ status: "ok" });
    expect(value.health.backofficeFunc).toEqual({ status: "ok" });
    expect(value.message).toBe("It's working!");
  });

  it("reports ko for signEventsHub when it fails", async () => {
    const useCase = makeInfoUseCase({ logger, signEventsHub: hubKo, backofficeFunc: backofficeOk });
    const result = await useCase({ query: "" });
    expect(result.isOk()).toBe(true);
    const value = result._unsafeUnwrap();
    expect(value.health.signEventsHub).toEqual({ status: "ko", error: "Service unavailable: hub down" });
    expect(value.health.backofficeFunc).toEqual({ status: "ok" });
  });

  it("reports ko for backofficeFunc when it fails", async () => {
    const useCase = makeInfoUseCase({ logger, signEventsHub: hubOk, backofficeFunc: backofficeKo });
    const result = await useCase({ query: "" });
    expect(result.isOk()).toBe(true);
    const value = result._unsafeUnwrap();
    expect(value.health.signEventsHub).toEqual({ status: "ok" });
    expect(value.health.backofficeFunc).toEqual({ status: "ko", error: "Service unavailable: backoffice down" });
  });

  it("runs health checks in parallel", async () => {
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    let hubResolved = false;
    let backofficeResolved = false;
    const slowHub: SignEventsHub = {
      checkHealth: async () => { await delay(50); hubResolved = true; return ok(undefined); }
    };
    const slowBackoffice: BackofficeFunc = {
      checkHealth: async () => { await delay(50); backofficeResolved = true; return ok(undefined); }
    };
    const start = Date.now();
    const useCase = makeInfoUseCase({ logger, signEventsHub: slowHub, backofficeFunc: slowBackoffice });
    await useCase({ query: "" });
    expect(Date.now() - start).toBeLessThan(150);
    expect(hubResolved).toBe(true);
    expect(backofficeResolved).toBe(true);
  });
});
