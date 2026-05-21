# Shared harness strategy for backend test generation

Use this reference when building the local topology for either integration or record-replay work.

## First inspect

Before implementing anything, inspect:

1. the current test runner, config shape, and command conventions
2. the real inbound surface under test:
   - HTTP route or service
   - Azure Functions trigger or host
   - worker, queue, topic, or scheduled process
   - adapter or repository seam when a smaller slice is the honest contract
3. the local startup path for the runtime
4. each dependency the scenario needs
5. nearby tests, fixtures, payloads, and known regressions
6. any existing live-test harness you can reuse
7. whether a tiny runtime probe can answer the next uncertainty before you read dependency internals

## Prefer cheap probes before dependency source dives

When the next blocker is "does this runtime or helper actually behave this way?", prefer a tiny local probe first.

- Start with the repository's own examples, the loaded skill references, and a 5-10 line runtime script.
- Use dependency source only when the probe stays ambiguous and that ambiguity would change the chosen boundary, env map, or readiness strategy.
- If the probe confirms an important quirk, encode that understanding into the harness or reference notes so future runs do not have to rediscover it.

## Delegate only bounded probe work

Use delegation to contain context, not to parallelize the whole workflow.

- Keep boundary choice, workflow routing, scenario selection, and shared harness design in the main thread.
- If the environment supports subagents and a probe becomes noisy but stays independent, delegate only that probe. Good candidates include a tiny Testcontainers smoke bootstrap, host reachability checks, runtime startup quirks, or validating whether an existing runtime container can be reused.
- Give the subagent one concrete question, the smallest relevant inputs, and a crisp success or failure shape.
- Ask for a compressed result: conclusion, minimal evidence, relevant files or commands, and the next decision it unlocks. Do not ask for long transcripts.
- Do not split one shared harness design across multiple subagents. Parallelize only probe work whose result feeds one owner back in the main thread.

## Boundary choice

Pick the smallest honest boundary for the contract the user wants to protect.

| Situation                                                               | Preferred boundary                              | Why                                                               | Avoid                                                       |
| ----------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| HTTP route, middleware, auth, serialization, headers, or status mapping | full local runtime                              | those behaviors only become real at the host boundary             | importing handlers directly when the server can run locally |
| Azure Functions trigger, binding, or emitted runtime output             | local Functions host or equivalent runtime      | host wiring is part of the contract                               | direct handler invocation when a credible local host exists |
| worker or consumer reacting to broker messages                          | real local worker plus local broker or emulator | transport semantics and runtime wiring matter                     | unit tests that only call the handler with mocks            |
| repository, storage adapter, cache adapter, or client adapter           | smaller integration slice plus real dependency  | the contract is between the adapter and the real dependency       | booting the full HTTP host just to test CRUD or mapping     |
| one happy path needs host proof but the variation matrix is large       | mixed boundaries intentionally                  | one runtime proof plus narrower slices usually gives better value | forcing every branch through the host                       |

## Dependency classification

Classify each dependency before you code:

| Dependency type                                     | Preferred technique                                                                 | Observe results through                                                                                      |
| --------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| cloud service with connection string in `.env.test` | pre-deployed cloud service when probe passes, Testcontainers fallback when it fails | read-back helpers that query the real cloud or local dependency (see `references/cloud-services-harness.md`) |
| partner HTTP service                                | deterministic local stub, fake, or proxy                                            | the request the stub received and the system response it triggered                                           |
| storage, document DB, cache, queue, or broker       | Testcontainers-managed dependency or credible emulator                              | read-back helpers that query the real local dependency                                                       |
| runtime component that already owns env and startup | reuse that runtime shape as the runtime component                                   | the real boundary it exposes                                                                                 |
| dependency with no credible local path              | documented fallback                                                                 | the closest honest local seam                                                                                |

## Prefer an existing runtime container when available

If the repository already ships a Dockerfile, devcontainer task, or other containerized runtime that owns env and startup credibly, prefer reusing that runtime shape instead of rebuilding those concerns in the test harness.

- Treat the app runtime as another topology component.
- Keep env, build, and startup ownership inside that runtime container when it already solves those concerns credibly.
- Use existing runtime container definitions or Dockerfiles as hints for the reused runtime shape and adjacent dependencies.
- Keep the test harness focused on readiness checks, driving traffic, and reading side effects.

## Testcontainers policy

Treat Testcontainers as the only standard orchestration path for containerized dependencies.

- Prefer official Testcontainers modules when they exist.
- If the workspace lacks `testcontainers` and the dependency can credibly run that way, add it.
- Do not declare Testcontainers unavailable from a missing local `docker` CLI alone. Check Docker-compatible env/runtime hints and run a tiny real Testcontainers smoke bootstrap before falling back.
- If that smoke bootstrap fails, surface the concrete failure reason in the notes instead of inferring one from missing tooling.
- Read checked-in Dockerfiles, devcontainer tasks, container image definitions, startup scripts, and env docs as topology inputs.
- Keep orchestration inside Testcontainers helpers and test setup code, not shell-based Docker commands.
- If the runtime itself is containerized, reuse that runtime shape inside the same harness strategy instead of inventing a second orchestration path.
- Before forcing a platform like `linux/amd64`, inspect the image manifest and host architecture. Prefer a native image when one exists.

## Network reachability in devcontainers

When the harness runs inside a devcontainer, Codespace, or other shared workspace container, do not assume Docker-published dependency ports are reachable through `127.0.0.1`.

- Probe a small candidate set from the test process itself, such as `127.0.0.1`, `host.docker.internal`, the Docker bridge gateway, and an explicit override env.
- Keep the chosen host path explicit in the setup code and, when relevant, in persisted topology metadata.
- Treat "container port is published" and "the harness can actually reach it" as separate checks.
- If published ports remain unreliable, attach the workspace container to the same Docker network as the dependency containers and talk to them through network aliases when that is the most stable path.
- If Testcontainers inherits a Docker config that points at an unavailable credential helper, set `DOCKER_CONFIG` to a minimal writable directory **before** the Node or Vitest process starts. Do not leave this fix to `globalSetup`; some auth paths read Docker config during module import.

## Environment validation before startup

Many systems fail before your scenario runs because required environment values are evaluated during startup or import-time config loading.

- Treat checked-in example env files, runtime-local settings files, and README snippets as hints, not as a guaranteed source of truth.
- Compare those hints against the real startup config module and infrastructure defaults.
- If they are stale or incomplete, inject a complete env map explicitly from the harness or reused runtime container.

Validate categories like:

- runtime bootstrap settings
- dependency connection settings
- application config values that the app validates during startup

Even if the chosen scenario does not use every dependency at runtime, startup may still require valid values for URLs, service identifiers, feature flags, container names, database names, or broker names.

Prefer syntactically valid local values, not just non-empty placeholders. Startup config often validates URLs, IDs, and connection strings at import time, so obviously fake values can still prevent the app from loading.

## Harness object construction

When the harness is a TypeScript or JavaScript class, avoid eager class-field initialization for resources that depend on other fields.

- Class fields run in declaration order during construction.
- A field like `queueClient = queueServiceClient.getQueueClient(queueName)` will fail if `queueServiceClient` or `queueName` is declared later.
- Prefer constructor assignment, explicit setup methods, or lazy getters for derived SDK clients, container handles, queue handles, and similar read-back helpers.

## Readiness rules

Prove readiness at the level the scenario actually needs.

Good readiness signals:

- a real endpoint returning a valid response
- a warmup write plus readback against the exact storage path the scenario needs
- a local stub responding on the exact route the runtime will call

Weak readiness signals:

- only waiting for a port to open
- assuming "container started" means "dependency is usable"
- account-level metadata probes when the scenario needs container-level reads or writes

## Assertion rules

Assert on observable behavior, not helper calls.

Prefer:

- HTTP status, headers, and body
- outbound requests observed by a local stub
- rows, documents, blobs, keys, or messages read back from the real dependency
- meaningful failure modes at the chosen boundary

Avoid:

- mock call counts
- spy assertions on dependencies you claim to be integrating with
- implementation-shaped assertions that disappear when the real boundary runs

## Cross-cutting rules

These rules apply to every path (integration, record-replay, or both). Other references defer here instead of restating them.

### Reuse before inventing

If the workspace already has a live-test harness, shared container setup, or stronger local convention for the same boundary, reuse it. Do not create a parallel harness.

### Both-paths coexistence

When the user chooses `both`:

- keep one shared container startup path and one source of connection metadata
- let the shared harness own Testcontainers startup, connection metadata, and generic fixtures
- let integration own long-lived live assertions
- let record-replay own cassettes, normalization, `record` / `verify`, and characterization-only helpers
- split suites or Vitest projects only when include patterns or lifecycle rules truly differ
- do not clone container startup code across suites

### Testcontainers as the only orchestration path

Treat Testcontainers as the only standard orchestration path for containerized dependencies. Do not switch to shell-driven container orchestration as a normal fallback. If Testcontainers appears blocked, prove it with a tiny real bootstrap before declaring it unavailable.

## Final decision check

Before you proceed, confirm that:

1. the chosen boundary matches the contract the user cares about
2. each dependency has an explicit local strategy
3. containerized dependencies use Testcontainers
4. the side effects can be observed through the real local seam
5. the new work reuses an existing harness when one already covers the same boundary
