# Record-replay workflow for generated backend tests

Read this after the user chooses the `record-replay` path.

## Goal

Freeze observable backend behavior through a real local boundary so future refactors can verify drift without rewriting the cassette unless record mode is explicit.

## Outcome

Produce or update:

- a capture script or reusable entrypoint that boots the local topology and writes multilayer cassettes
- black-box verification tests that call only the real local boundary
- normalization and side-effect helpers that are owned by the characterization folder
- explicit `record` and `verify` commands plus a note explaining what was frozen

## Source-level black-box rule

Keep the characterization harness contract-local by default.

- Do not import handlers, services, models, decoders, generated types, config helpers, or runtime-coupled shared packages from the target codebase into the characterization harness.
- Treat exported wrappers, route-registration modules, workspace packages used by the app, and published runtime helper packages as target code too. Package-name imports do not make them safe.
- Relative imports that climb out of the characterization folder into the target app are an immediate failure signal, not a convenience exception.
- Prefer local request builders, local schemas, plain JSON assertions, OpenAPI examples, and raw SDK or protocol calls owned by the characterization folder.
- The routine exception is the minimal boot wrapper needed to start the real runtime.
- If the only way to drive the scenario is by importing target code, stop and report the record-replay path blocked or ask the user to switch workflows.

## Core workflow

1. Start from the shared harness and chosen boundary.
2. Pick one representative scenario at a time.
3. Boot the minimum local topology required for that scenario.
4. Start or attach to the real local runtime.
5. Prove readiness at the exact boundary and dependency level the scenario needs.
6. Send the canonical input through the real local boundary.
7. For happy-path scenarios, confirm the live result is success-shaped before recording it.
8. Read back the relevant side effects from the real local dependencies.
9. Write the cassette layers deterministically.
10. Run `verify` once after the first successful capture so future runs fail on drift instead of silently rewriting artifacts.

## Capture script guidance

Generate a reusable script or CLI entrypoint when the repository does not already have one.

The workflow should:

1. boot dependencies first
2. start or attach to the target runtime
3. wait for readiness
4. send one or more canonical inputs
5. collect response plus side-effect observations
6. write cassette artifacts
7. tear the topology down cleanly when appropriate

Prefer two explicit modes:

- `record`: intentionally refresh the cassette
- `verify`: rerun unchanged and fail on drift without mutating stored artifacts

## What to freeze

Freeze what a real local client or adjacent system can observe:

- HTTP request and response contract
- queue, topic, or worker input and output payloads
- stored blobs, documents, rows, cache entries, or emitted messages
- normalized outbound dependency exchanges observed by local stubs
- topology facts that matter for replay

Do not freeze irrelevant noise:

- timestamps unless they are semantically part of the contract
- trace or correlation IDs
- ephemeral hostnames or ports after normalization
- helper-call counts
- incidental framework metadata

Read `references/cassette-layout.md` before you write cassette files. That reference owns cassette file responsibilities, deterministic layer formatting, and the detailed secret-redaction checklist; this workflow owns the record/verify orchestration and boundary rules.

## Verification tests

Write tests that remain black-box:

- call only the running local runtime, host, or worker seam
- reuse the stored cassette as the contract source
- compare live responses and side effects against the stored artifacts
- keep assertions at the external contract level

Treat the cassette as the only durable oracle for verification:

- in `verify`, prefer equality against the normalized cassette layers rather than semantic matchers like `toMatchObject`, hand-written field assertions, schema decoders, or helper-specific payload expectations
- do not restate the same contract twice, once in cassette JSON and again in test code; that weakens characterization by turning it into a partial spec
- if you need long-lived semantic assertions that survive cassette refreshes, that is integration coverage; move the scenario to `integration` or `both`

Do not let verification drift back into in-process imports just because it is convenient.

## Local dependency rules

Follow the dependency classification and Testcontainers policy in `references/shared-harness.md`. Additionally for record-replay work:

- Normalize unstable values through shared helpers that both `record` and `verify` use.
- Keep recorder helpers local to the characterization folder.

## Happy-path safety

For scenarios labeled happy path:

- do not accept a recorded 4xx or 5xx as "good enough" just because it is reproducible
- require a minimally meaningful success shape before writing the cassette
- sanity-check the stored artifacts after the first capture

Keep those checks capture-time only. A tiny success-shaped guard before writing the first cassette is useful; carrying the same guard forward as an extra `verify` assertion is not.

## When both paths are selected

Follow the both-paths coexistence rules in `references/shared-harness.md`.

## Guardrails

- Prefer real local execution over direct handler imports.
- Prefer source-level black-box harness code too.
- End with a quick import audit of the characterization folder; every import must be Node built-ins, third-party SDK/protocol clients, generic test tooling, or characterization-local support code.
- Keep cassettes small and reviewable, split by concern.
- Follow the cassette-layout redaction checklist before writing any cassette layer.
- Explain any non-Testcontainers exception explicitly instead of hiding it inside the harness.
