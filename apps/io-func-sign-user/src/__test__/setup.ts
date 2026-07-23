import { vi } from "vitest";

/**
 * Stub @pagopa/ts-commons/lib/agent to prevent it from calling
 * require('node-fetch') at module load time. node-fetch@3 is ESM-only
 * and cannot be require()'d in vitest's CommonJS environment.
 */
vi.mock("@pagopa/ts-commons/lib/agent", () => ({
  getHttpFetch: () => globalThis.fetch,
  getHttpsFetch: () => globalThis.fetch
}));
