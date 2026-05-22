# Shared Testcontainers lifecycle for Vitest backend suites

Use this reference whenever an integration or record-replay suite runs on **Vitest**, especially when Redis, Postgres, Azurite, Cosmos emulators, brokers, or other stateful services dominate runtime.

This is the default Vitest lifecycle for the skill. Do not drop back to per-test container startup just because it is quicker to wire. That makes watch mode slow and encourages brittle cleanup.

## Core idea

Split the lifecycle in three:

1. **Shared dependencies live for the whole Vitest process**
   - start them once in `globalSetup`
   - print or provide the connection details
   - stop them once in teardown
2. **Per-test fixtures stay disposable**
   - create only the mutable resources a test needs
   - delete them automatically after the test
   - never rely on "shared container means shared data"
3. **The app runtime stays separate**
   - if the app or Functions host must restart to pick up code changes, keep that restartable process separate from the shared dependency containers

The point is to pay the expensive container cost once while keeping tests isolated.

## Recommended layout

Adjust naming to local conventions, but keep the split:

```text
vitest.config.ts
tests/
  global-setup.ts
  with-test-fixtures.ts
  support/
    shared-testcontainers.ts
    cosmos.ts
    azurite.ts
    cleanup.ts
    ids.ts
  <suite-name>/
    <scenario>.test.ts
```

- `global-setup.ts` starts and stops the shared dependencies
- when the suite owns multiple stateful dependencies, `global-setup.ts` composes per-dependency support modules instead of owning every emulator detail inline
- `with-test-fixtures.ts` exposes builder-pattern fixtures for disposable resources
- `support/shared-testcontainers.ts` or the per-dependency modules own the Testcontainers startup helpers
- `support/cleanup.ts` owns resource-specific deletion helpers

If the repository already has a better test layout, reuse it. The lifecycle split matters more than the exact folders.

If integration and record-replay suites coexist, keep them as sibling directories or Vitest projects that reuse the same `support/` layer instead of cloning the harness.

## When both paths also exist

Follow the both-paths coexistence rules in `references/shared-harness.md`. If the suites truly need different include patterns or reporters, use separate Vitest projects that import the same `support/shared-testcontainers.ts` style helper instead of booting the same dependencies twice.

## `global-setup.ts` responsibilities

Use the shared setup file to boot expensive dependencies once and surface the connection details to tests.

Typical responsibilities:

- start Redis, Azurite, Cosmos emulator, Postgres, brokers, or similar shared services
- pin any image tags or emulator flags that the repo already depends on
- print stable connection info once for debugging
- provide the values to tests through Vitest's supported `provide` or `inject` path
- stop resources in reverse order during teardown

If `global-setup.ts` needs to manage two or more stateful dependencies, keep it as a composition root:

- each dependency module owns its own startup, readiness proof, and dependency-specific helpers
- `global-setup.ts` imports those modules, combines their provided values, and coordinates teardown
- keep single-purpose files such as cassette helpers, runtime host wrappers, or tiny HTTP stubs separate by responsibility rather than forcing them into per-dependency modules

If the app itself is stable enough to run once for the whole session, you may start it here too. If it needs frequent restarts, keep it outside the shared dependency lifecycle.

## `withTestFixtures` responsibilities

Use Vitest's builder-pattern `test.extend(...)` fixtures so setup and cleanup stay next to the resource they own.

Typical per-test fixtures:

- Redis key namespaces
- Postgres schemas or databases
- Cosmos containers
- queue names or subscriptions
- blob prefixes
- seeded documents or rows

Prefer the cleanup primitive the installed Vitest version actually supports:

- if the local version exposes `onCleanup`, use it
- otherwise keep cleanup inside the fixture with `await use(resource)` plus `try/finally`

Do not silently fall back to suite-level cleanup just because the local Vitest version is older.

## Watch mode

This lifecycle is especially valuable in watch mode:

- expensive services stay alive across reruns
- only the code under test and disposable per-test state change
- failures are easier to reproduce because the environment is not constantly being torn down and rebuilt

If watch reruns become flaky, the problem is usually fixture leakage, not the shared containers themselves.

## What should stay per-test

Keep mutable resources test-scoped even when the backing service is shared:

- rows, schemas, or tables that a single test mutates
- queue names or subscriptions
- blob prefixes
- Redis keys or streams
- temporary files or downloaded outputs

If two tests can observe each other's leftovers, the suite will eventually rot.

For general Testcontainers policy, follow `references/shared-harness.md`; this file only defines the Vitest lifecycle split.

## Timeout configuration

Testcontainers startup and real runtime boot take significantly longer than unit tests. Configure timeouts explicitly to avoid false failures.

- Set `testTimeout` in `vitest.config.ts` to at least 30 seconds for integration or characterization suites. Higher values may be needed when multiple containers start during `globalSetup`.
- Use `startupTimeout` on Testcontainers instances when the default is too short for heavier images such as Cosmos emulators.
- Keep the `globalSetup` timeout generous enough for first-run image pulls. A cold pull can exceed 60 seconds depending on image size and network.
- If the suite uses a separate Vitest project for integration work, set the timeout only in that project config so the fast unit suite is not affected.

## Practical checklist

Before you commit to the lifecycle, confirm:

1. the repo already uses Vitest or can add a Vitest-specific integration config credibly
2. the expensive dependencies can be shared safely across the suite
3. each test can allocate disposable state and clean it automatically
4. the app runtime can either run once or restart independently from the shared dependencies
5. the rerun command is explicit so the default fast unit test suite does not boot the whole topology
