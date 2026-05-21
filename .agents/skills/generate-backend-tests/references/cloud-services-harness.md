# Cloud services harness (pre-deployed environments)

Read this reference only when a `.env.test` file exists at the repository root, the current package/app directory, a parent directory up to the repository root, or a path explicitly indicated by the user. This file signals that the team maintains pre-deployed cloud services whose connection strings are available for testing against real infrastructure.

## Philosophy

Pre-deployed cloud services offer the highest-fidelity test boundary — no emulator quirks, no port mapping, no cold-start time. But they come with a shared-state contract: other humans, pipelines, or environments may own data in those services. The harness must be a good citizen: probe before assuming reachability, never overwrite data it does not own, and clean up surgically after itself.

## When this applies

This reference applies when **all** of the following hold:

1. A `.env.test` file exists in the lookup path below and contains connection strings for one or more cloud services.
2. The user has not explicitly asked for a purely local topology.
3. The dependency classification step (from `references/shared-harness.md`) identifies at least one dependency that has a matching connection string in `.env.test`.

If `.env.test` does not exist in the lookup path, ignore this reference entirely. Do not ask the user about it and do not mention it.

## Finding `.env.test`

Use progressive disclosure: check for `.env.test` before reading this file's guidance. Search only these locations:

1. the repository root
2. the current package or app directory, when different from the root
3. parent directories from the package/app directory up to the repository root
4. a path explicitly provided by the user

If multiple `.env.test` files exist, prefer the closest one to the suite being added or changed. If there is no clear closest file, choose the repository root file and state that choice in the harness notes.

## Reading `.env.test`

Parse the file as a standard dotenv file (one `KEY=VALUE` per line, no shell expansion required). Typical keys include:

- `*_CONNECTION_STRING` or `*_CONNSTRING` — connection strings for databases, storage accounts, or messaging
- `*_ENDPOINT` — HTTP endpoints for APIs or services
- `*_KEY` or `*_ACCOUNT_KEY` — authentication keys paired with endpoints

Group the entries by the service they represent. A single connection string often encodes endpoint + credentials together (e.g., Cosmos DB, Azure Storage).

## Connectivity probe

For each cloud service found in `.env.test`, perform a lightweight reachability probe before declaring it usable:

| Service type | Probe strategy |
| --- | --- |
| Cosmos DB | Use the official Cosmos SDK with the exact connection string or endpoint/key shape the app will use. Run the cheapest account/database-level operation the SDK supports with a timeout wrapper. Do not hand-roll Cosmos auth signatures with raw HTTP. |
| Azure Storage (Blob/Queue/Table) | Use the official Azure Storage SDK with the connection string the app will use. List at most one container, queue, or table, or call the lightest service-properties operation available. Do not parse and sign raw Storage requests by hand. |
| Application Insights | Attempt an HTTP GET to the ingestion endpoint health path. This service is fire-and-forget for tests, so a timeout is acceptable — just disable telemetry emission in tests if unreachable. |
| Generic HTTP endpoint | Issue a `HEAD` or `GET /` with a short timeout (3-5 seconds). |

### Probe rules

- Set a **hard timeout of 5 seconds** per probe by racing the SDK or HTTP probe against an abort signal or timer. Do not retry. A timeout means "fall back to local."
- Run probes **in parallel** when multiple services are present.
- A probe failure for one service does not disqualify other services. The harness may use a hybrid topology: some dependencies against real cloud services and others against local Testcontainers or stubs.
- Log probe results clearly so test output shows which services are live and which fell back to local.
- Treat SDK authentication, authorization, DNS, TLS, and timeout errors as "not usable for this run" unless the scenario explicitly tests those failures.

### Probe result shape

After probing, classify each dependency as:

```
cloud   → connection string present AND probe succeeded → use the cloud service
local   → connection string absent OR probe failed       → use Testcontainers / emulator / stub
```

Communicate this classification early in the harness setup so downstream test code does not need to care which path was chosen.

## Hybrid topology

A single test run may mix cloud and local dependencies. The harness must handle this cleanly:

- Expose a unified interface (e.g., a `TestHarness` or `TestTopology` object) that provides connection metadata for each dependency regardless of provenance.
- When a cloud service is reachable, pass its connection string directly from `.env.test`.
- When a cloud service is unreachable, fall back to the standard Testcontainers path from `references/shared-harness.md`.
- Keep the decision logic in setup/bootstrap, not scattered across individual tests.

Example shape:

```ts
interface DependencyTopology {
  cosmos: { endpoint: string; key: string; source: "cloud" | "local" };
  storage: { connectionString: string; source: "cloud" | "local" };
  // ...
}
```

## Fixture isolation on shared cloud services

Cloud services are shared state. The harness must guarantee that test fixtures do not collide with existing data or other concurrent test runs.

### Unpredictable identifiers

For every piece of data the test writes to a cloud service, use identifiers that cannot collide with existing fixtures or other test runs:

- Prefix IDs with a run-unique token: `test-<uuid4-short>-<descriptive-slug>` (e.g., `test-a3f7b2-user-profile`).
- For container/database names that must be created: `test-<uuid4-short>-<purpose>`.
- Never use predictable, sequential, or human-readable IDs like `test-1`, `user-123`, or `fixture-default`.
- Generate the run-unique token once per test suite execution (in `globalSetup` or harness bootstrap) and share it across all tests in the run.

### Scoping strategy

| Resource level | Strategy |
| --- | --- |
| Database / Container (Cosmos) | Prefer writing to existing databases/containers rather than creating new ones. If a test needs its own container, create it with a run-scoped name and delete it in cleanup. |
| Documents / Items | Always use run-scoped IDs. Query by partition key + ID on cleanup. |
| Blobs | Use a run-scoped prefix path: `test-runs/<run-token>/blob-name`. Delete by prefix on cleanup. |
| Queues | Create run-scoped queue names. Delete the queue on cleanup. |
| Table rows | Use a run-scoped partition key. Delete by partition key on cleanup. |

### Read-only assertions on existing data

If a test needs to assert against pre-existing data in the cloud service (e.g., a seeded reference document), treat it as read-only. Never mutate, overwrite, or delete data that the test did not create.

## Surgical cleanup

Every fixture the test creates must be removed after the run, regardless of whether tests pass or fail.

### Cleanup principles

- Register cleanup actions as each resource is created, not as an afterthought at the end. Use a cleanup stack (LIFO) pattern so resources are deleted in reverse creation order.
- Run cleanup in `afterAll` / `globalTeardown` — never skip it on test failure.
- Cleanup must be **idempotent**: deleting an already-absent resource should not throw.
- Cleanup must be **scoped**: only delete resources that match the current run token.
- If cleanup fails (e.g., transient network error), log a warning with the resource identifiers so a human can clean up manually if needed. Cleanup failures should not mask the original test assertion failure, but they must be reported as a harness failure when the run would otherwise pass.

### Cleanup implementation pattern

```ts
type CleanupFn = () => Promise<void>;
const cleanupStack: CleanupFn[] = [];

function registerCleanup(fn: CleanupFn) {
  cleanupStack.push(fn);
}

async function runCleanup() {
  while (cleanupStack.length > 0) {
    const fn = cleanupStack.pop()!;
    try {
      await fn();
    } catch (err) {
      console.warn("[cleanup] failed, manual intervention may be needed:", err);
    }
  }
}
```

### Verify cleanup

After implementing the harness, include a brief verification step: run the test suite and then query the cloud service for any resources matching the run token. If any remain, the cleanup logic has a gap.

- Fail the suite when resources matching the current run token remain after cleanup.
- Include the service, resource type, and exact identifiers in the failure message.
- Keep deletion scoped to the current run token only; never broaden cleanup to "all test resources" or old prefixes that may belong to another run.

## Environment variable precedence

When both `.env.test` (cloud) and local containers produce connection strings for the same service, the probe result determines which one wins:

1. If the cloud probe succeeded → use the cloud connection string from `.env.test`.
2. If the cloud probe failed → start the local container and use its dynamically assigned connection string.
3. Never inject both into the runtime simultaneously for the same logical dependency.

## Interaction with other references

- `references/shared-harness.md`: The dependency classification table gains a new row — "cloud service with connection string in `.env.test`" as a preferred technique for any dependency whose probe passes. The existing Testcontainers path becomes the fallback.
- `references/azure-harness.md`: The Cosmos and Storage emulator guidance remains the fallback path. When cloud probes pass, the emulator is unnecessary for those specific services.
- Integration and record-replay workflows: Both work unchanged on top of this harness. The test code does not know or care whether a dependency is cloud or local — the harness abstracts this.

## What to report

When the harness uses cloud services, include in the final report:

- Which services were probed and their status (cloud / local fallback)
- The run-scoped token used for fixture isolation
- Confirmation that cleanup ran successfully or any resources that require manual cleanup
- How to re-run: mention that `.env.test` must be present and the services reachable for the cloud path; otherwise tests gracefully degrade to local
