import { describe, it, expect, vi } from "vitest";
import { ok, err } from "neverthrow";
import { ServiceUnavailableError } from "@pagopa/hexagonal-core/domain/errors";
import { makeInfoUseCase } from "../info.use-case.js";
import type { SignEventPublisher } from "../../../domain/ports/outbound/sign-event-publisher.js";
import type { BackofficeService } from "../../../domain/ports/outbound/backoffice-service.js";
import type { Logger } from "@pagopa/hexagonal-core/domain/ports";

const noop = () => {};
const logger: Logger = {
  debug: noop,
  error: noop,
  flush: () => Promise.resolve(),
  info: noop,
  trackEvent: noop,
  trackException: noop,
  warn: noop,
  with: () => logger
};

const hubOk: SignEventPublisher = { checkHealth: async () => ok(undefined) };
const backofficeOk: BackofficeService = { checkHealth: async () => ok(undefined) };

const hubKo: SignEventPublisher = {
  checkHealth: async () => err(new ServiceUnavailableError("hub down"))
};
const backofficeKo: BackofficeService = {
  checkHealth: async () => err(new ServiceUnavailableError("backoffice down"))
};

describe("makeInfoUseCase", () => {
  it("returns ok with all health checks green", async () => {
    const useCase = makeInfoUseCase({ logger, signEventPublisher: hubOk, backofficeService: backofficeOk });
    const result = await useCase({ query: "" });
    expect(result.isOk()).toBe(true);
    const value = result._unsafeUnwrap();
    expect(value.message).toBe("It's working!");
    expect(typeof value.version).toBe("string");
  });

  it("returns err when signEventPublisher fails", async () => {
    const useCase = makeInfoUseCase({ logger, signEventPublisher: hubKo, backofficeService: backofficeOk });
    const result = await useCase({ query: "" });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain("hub down");
  });

  it("returns err when backofficeService fails", async () => {
    const useCase = makeInfoUseCase({ logger, signEventPublisher: hubOk, backofficeService: backofficeKo });
    const result = await useCase({ query: "" });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain("backoffice down");
  });

  it("aggregates multiple failures in the error message", async () => {
    const useCase = makeInfoUseCase({ logger, signEventPublisher: hubKo, backofficeService: backofficeKo });
    const result = await useCase({ query: "" });
    expect(result.isErr()).toBe(true);
    const msg = result._unsafeUnwrapErr().message;
    expect(msg).toContain("hub down");
    expect(msg).toContain("backoffice down");
  });

  it("runs health checks in parallel", async () => {
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    let hubResolved = false;
    let backofficeResolved = false;
    const slowHub: SignEventPublisher = {
      checkHealth: async () => { await delay(50); hubResolved = true; return ok(undefined); }
    };
    const slowBackoffice: BackofficeService = {
      checkHealth: async () => { await delay(50); backofficeResolved = true; return ok(undefined); }
    };
    const start = Date.now();
    const useCase = makeInfoUseCase({ logger, signEventPublisher: slowHub, backofficeService: slowBackoffice });
    await useCase({ query: "" });
    expect(Date.now() - start).toBeLessThan(150);
    expect(hubResolved).toBe(true);
    expect(backofficeResolved).toBe(true);
  });
});
