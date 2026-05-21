# Integration workflow for generated backend tests

Read this after the user chooses the `integration` path.

## Goal

Add or refactor integration tests that exercise an honest local contract and keep mocks out of the critical path.

## Outcome

Produce or update:

- a focused integration suite at the chosen runtime boundary or honest multi-layer slice
- shared setup files, fixture builders, or local support helpers when the suite needs them
- deterministic local stubs for outbound HTTP dependencies when the third-party system itself is not part of the contract
- rerun commands such as `test:integration`, `integration:watch`, or the repository equivalent

## Core workflow

1. Start from the boundary chosen through `references/shared-harness.md`.
2. Mine nearby unit tests, payload samples, or existing fixtures for high-value scenarios, but do not port them one-for-one.
3. Boot only the local topology needed for the selected scenarios.
4. Keep expensive shared dependencies alive once per suite when the runner and repo conventions support it.
5. Drive the real boundary and assert on observable contract plus side effects.
6. Keep the suite opt-in if the topology is expensive.
7. Explain any narrower-slice choice plainly when you do not use the full runtime.

## Boundary guidance

Prefer the full local runtime when the user cares about:

- routes, middleware, auth, serialization, status codes, or headers
- Functions triggers, bindings, or runtime wiring
- worker transport semantics
- configuration or DI wiring that unit tests erase

Prefer a smaller integration slice when the user cares about:

- adapter or repository behavior against a real dependency
- real client-adapter protocol behavior against a local stub
- use-case orchestration with real adapters and persistence
- denser error variation where repeating the full host would mostly add noise

Mixed suites are healthy. One runtime-level happy path plus a smaller number of narrower slices is often better than forcing every branch through the host.

## Scenario quality

Good integration scenarios usually preserve:

- meaningful request or event shapes
- domain invariants that still matter with real dependencies
- side effects a caller or downstream system would notice
- a small set of failure modes worth real boundary cost

Drop or rewrite:

- private helper expectations
- fake clients that only existed for unit tests
- mock call counts
- tiny branches whose value disappears once the real boundary is exercised

Read `references/promoting-unit-tests.md` when the starting point is a deep mock-heavy unit suite.

## Assertion style

Follow the assertion rules in `references/shared-harness.md`. Additionally for integration work:

- do not keep old unit-test factories if they obscure the real payload or seed data
- prefer failure responses that real callers would observe over internal error types

## Import policy

Keep the suite honest, not dogmatic.

- If the boundary is the real runtime, drive it through the runtime.
- If the boundary is a smaller slice, importing the real classes under test is fine.
- Avoid importing mock factories or fake clients just to preserve unit-test shape.
- Prefer local seed and read-back helpers when they make the contract clearer.

## Local dependency rules

Follow the dependency classification and Testcontainers policy in `references/shared-harness.md`. Additionally for integration work:

- Seed only the minimum data a scenario needs.

## Commands and ergonomics

- Keep the suite behind explicit commands when it is slower than the default unit run.
- Build once in the explicit integration command rather than inside every test body when possible.
- If watch mode matters, keep shared dependencies separate from restartable app processes.

## When both paths are selected

Follow the both-paths coexistence rules in `references/shared-harness.md`.
