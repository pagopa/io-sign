import { describe, it, expect } from "vitest";
import { ok, err } from "neverthrow";
import { ServiceUnavailableError } from "@pagopa/hexagonal-core/domain/errors";
import { makeInfoUseCase } from "../info.use-case.js";
import type { SignEventPDNDPublisher } from "../../../domain/ports/outbound/sign-event-pdnd-publisher.js";
import type { BackofficeService } from "../../../domain/ports/outbound/backoffice-service.js";
import type { SignEventWebhookQueuePublisher } from "../../../domain/ports/outbound/sign-event-webhook-queue-publisher.js";
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

const hubOk: SignEventPDNDPublisher = {
  checkHealth: async () => ok(undefined),
  sendAnalyticsEvent: async () => ok(undefined),
  sendBillingEvent: async () => ok(undefined)
};
const backofficeOk: BackofficeService = {
  checkHealth: async () => ok(undefined),
  getWebhookForIssuer: async () => ok(undefined)
};
const webhookQueueOk: SignEventWebhookQueuePublisher = {
  checkHealth: async () => ok(undefined),
  enqueue: async () => ok(undefined)
};

const hubKo: SignEventPDNDPublisher = {
  checkHealth: async () => err(new ServiceUnavailableError("hub down")),
  sendAnalyticsEvent: async () => ok(undefined),
  sendBillingEvent: async () => ok(undefined)
};
const backofficeKo: BackofficeService = {
  checkHealth: async () => err(new ServiceUnavailableError("backoffice down")),
  getWebhookForIssuer: async () => ok(undefined)
};
const webhookQueueKo: SignEventWebhookQueuePublisher = {
  checkHealth: async () =>
    err(new ServiceUnavailableError("webhook queue down")),
  enqueue: async () => ok(undefined)
};

describe("makeInfoUseCase", () => {
  it("returns ok with all health checks green", async () => {
    const useCase = makeInfoUseCase({
      logger,
      pdndPublisher: hubOk,
      backofficeService: backofficeOk,
      webhookQueuePublisher: webhookQueueOk
    });
    const result = await useCase({ query: "" });
    expect(result.isOk()).toBe(true);
    const value = result._unsafeUnwrap();
    expect(value.message).toBe("It's working!");
    expect(typeof value.version).toBe("string");
  });

  it("returns err when signEventPublisher fails", async () => {
    const useCase = makeInfoUseCase({
      logger,
      pdndPublisher: hubKo,
      backofficeService: backofficeOk,
      webhookQueuePublisher: webhookQueueOk
    });
    const result = await useCase({ query: "" });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain("hub down");
  });

  it("returns err when backofficeService fails", async () => {
    const useCase = makeInfoUseCase({
      logger,
      pdndPublisher: hubOk,
      backofficeService: backofficeKo,
      webhookQueuePublisher: webhookQueueOk
    });
    const result = await useCase({ query: "" });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain("backoffice down");
  });

  it("returns err when webhookQueuePublisher fails", async () => {
    const useCase = makeInfoUseCase({
      logger,
      pdndPublisher: hubOk,
      backofficeService: backofficeOk,
      webhookQueuePublisher: webhookQueueKo
    });
    const result = await useCase({ query: "" });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain("webhook queue down");
  });

  it("aggregates multiple failures in the error message", async () => {
    const useCase = makeInfoUseCase({
      logger,
      pdndPublisher: hubKo,
      backofficeService: backofficeKo,
      webhookQueuePublisher: webhookQueueKo
    });
    const result = await useCase({ query: "" });
    expect(result.isErr()).toBe(true);
    const msg = result._unsafeUnwrapErr().message;
    expect(msg).toContain("hub down");
    expect(msg).toContain("backoffice down");
    expect(msg).toContain("webhook queue down");
  });

  it("runs health checks in parallel", async () => {
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    let hubResolved = false;
    let backofficeResolved = false;
    let webhookQueueResolved = false;
    const slowHub: SignEventPDNDPublisher = {
      checkHealth: async () => {
        await delay(50);
        hubResolved = true;
        return ok(undefined);
      },
      sendAnalyticsEvent: async () => ok(undefined),
      sendBillingEvent: async () => ok(undefined)
    };
    const slowBackoffice: BackofficeService = {
      checkHealth: async () => {
        await delay(50);
        backofficeResolved = true;
        return ok(undefined);
      },
      getWebhookForIssuer: async () => ok(undefined)
    };
    const slowWebhookQueue: SignEventWebhookQueuePublisher = {
      checkHealth: async () => {
        await delay(50);
        webhookQueueResolved = true;
        return ok(undefined);
      },
      enqueue: async () => ok(undefined)
    };
    const start = Date.now();
    const useCase = makeInfoUseCase({
      logger,
      pdndPublisher: slowHub,
      backofficeService: slowBackoffice,
      webhookQueuePublisher: slowWebhookQueue
    });
    await useCase({ query: "" });
    expect(Date.now() - start).toBeLessThan(150);
    expect(hubResolved).toBe(true);
    expect(backofficeResolved).toBe(true);
    expect(webhookQueueResolved).toBe(true);
  });
});
