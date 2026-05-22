# io-func-sign-user — Backend Test Report

## Scope

Integration and characterization tests for `apps/io-func-sign-user`, an Azure Functions v4 app handling digital signing workflows. Tests exercise the handler-to-persistence boundary with real Cosmos DB, real Azurite storage, and HTTP stubs for external APIs.

## Path

**Both** — integration tests for ongoing contract coverage (scenarios 3 & 4) plus a record-replay characterization skeleton (scenario 1) for future use with a containerized Functions host.

## Honest Boundary

- **Integration tests**: Handler-level (via `azureFunction` wrapper or direct use-case invocation) → real Cosmos emulator → real Azurite → HTTP stubs for Namirial/PDV/Lollipop/IO Services.
- **Characterization test**: Full HTTP endpoint (requires containerized Functions host, optional in CI).

The full Azure Functions runtime host is intentionally avoided in integration tests because the Functions Core Tools do not support ARM64 natively. The chosen slice still covers Cosmos read/write, queue notifications, blob operations, and QTSP stub interactions.

## Shared Harness

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Cosmos DB | `mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview` via Testcontainers + HTTPS proxy | Document persistence |
| Azurite | `mcr.microsoft.com/azure-storage/azurite` via Testcontainers | Blob + Queue storage |
| HTTP stubs | In-process Node.js HTTP server | Namirial (QTSP), PDV Tokenizer, Lollipop, IO Services |
| HTTPS proxy | Local self-signed cert proxy | Bridges HTTP-only Cosmos emulator with SDK's HTTPS requirement |
| Event Hubs | Fake connection string (fire-and-forget) | Analytics events silently fail — safe in tests |

### Key Files

| File | Role |
|------|------|
| `tests/support/cosmos.ts` | Cosmos emulator + HTTPS proxy lifecycle |
| `tests/support/azurite.ts` | Azurite lifecycle |
| `tests/support/stubs.ts` | Stub server with prefix-routing |
| `tests/support/harness.ts` | Orchestrator — starts all deps, builds env map |
| `tests/support/fixtures.ts` | Test data factories (signature requests, signatures, documents) + stub handlers |
| `tests/global-setup.ts` | Vitest globalSetup — starts harness, sets env vars |
| `vitest.integration.config.ts` | Integration config with globalSetup |
| `vitest.characterization.config.ts` | Characterization config with globalSetup |

## Scenario Table

| # | Scenario | File | Boundary | Observable Outcome | Infra Used |
|---|----------|------|----------|-------------------|------------|
| 1 | GET signature request (characterization) | `tests/characterization/get-signature-request.test.ts` | Full HTTP endpoint (when containerized host available) | Response matches stored cassette | Cosmos, Azurite, Functions container |
| 3a | Create signature — happy path | `tests/integration/create-signature.test.ts` | Use-case + real adapters | Signature inserted, request → WAIT_FOR_QTSP, queue notified | Cosmos, Azurite, stubbed QTSP |
| 3b | Create signature — already SIGNED | `tests/integration/create-signature.test.ts` | Use-case + real adapters | Returns ActionNotAllowedError | Cosmos |
| 4a | Validate signature — COMPLETED | `tests/integration/validate-signature.test.ts` | `azureFunction` wrapper | Request → SIGNED, signature → COMPLETED, queue notified | Cosmos, Azurite, stub Namirial |
| 4b | Validate signature — FAILED | `tests/integration/validate-signature.test.ts` | `azureFunction` wrapper | Request → REJECTED, failure queued | Cosmos, Azurite, per-test stub |

## Rerun Commands

```bash
# Integration tests (Cosmos emulator + Azurite + stubs)
pnpm test:integration

# Record characterization cassettes (requires Docker with AMD64 emulation + built dist/)
pnpm test:record

# Verify characterization cassettes
pnpm test:verify

# Unit tests (unchanged, no containers needed)
pnpm test
```

## Intentional Gaps

- **HTTP/Lollipop auth layer** is not covered by integration tests. The Lollipop assertion verification flow requires complex SPID/CIE signature infrastructure that is better tested in isolation (covered by existing unit tests).
- **Containerized Functions host** is not used in integration tests due to ARM64 incompatibility. The characterization test supports it when a Docker host with AMD64 emulation is available.
- **Event Hub analytics** are fire-and-forget with fake connection strings. If analytics become critical, they should be tested separately.

## Notes for Future Extension

- To add new integration scenarios, follow the pattern in `validate-signature.test.ts`: seed Cosmos, call the handler wrapper, assert Cosmos state + queue messages.
- The `makeTestDocumentReady()` and `makeTestSignatureRequest()` factories in `fixtures.ts` produce valid io-ts-decodable documents.
- The shared harness starts once per vitest run via `globalSetup` — individual tests get Cosmos/Azurite/stubs URLs from `process.env.__TEST_*__` variables.
- The Namirial stub at `/namirial/api/token/` must return `{ access: "...", refresh: "..." }` (not `access_token`).
