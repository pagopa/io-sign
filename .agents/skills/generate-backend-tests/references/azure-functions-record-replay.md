# Azure Functions record-replay additions

> Prerequisites: read `references/azure-harness.md` and `references/azure-functions-harness.md` first. This file adds record-replay-specific guidance. Also read `references/shared-vitest-lifecycle.md` when the repo uses Vitest.

## Recommended file layout

Keep the layout close to the target app and separate reusable harness code from scenario assertions.

```text
src/
  characterization/
    <app>-happy-paths.test.ts
    cassettes/
      <scenario-name>/
        request.json
        response.json
        side-effects.json
        topology.json
        normalization.json
    support/
      cassettes.ts
      function-host.ts or app-runtime.ts
      harness.ts
```

Use different names if the repository already has a stronger testing convention, but preserve the separation:

- `*.test.ts` drives the real scenario
- `cassettes.ts` reads and writes the multilayer artifacts
- `function-host.ts` or `app-runtime.ts` owns starting or attaching to the real Functions runtime
- `harness.ts` owns Testcontainers-managed dependency containers, scenario seed data, and side-effect readers; if the app already runs in its own container, keep env and startup ownership there rather than in the harness

For Vitest-based characterization suites, prefer adding:

```text
tests/
  global-setup.ts
  with-test-fixtures.ts
```

Use those files as the default for the Vitest shared-container pattern. The dedicated reference explains that lifecycle split in detail. If the user explicitly asks for ephemeral containers, that is the exception path to justify rather than the starting point.

Keep the characterization folder independent from the target app's internal modules:

- do not import application models, io-ts decoders, zod schemas, generated API types, or helper functions into the characterization tests
- treat shared workspace packages, internal runtime libraries, generated clients, and published helper packages used by the function app as part of the forbidden surface too, even if they are imported by package name rather than relative path
- treat exported Azure Function wrappers or handlers, `app.http(...)` registration modules, and `wrapHandlerV4(...)` return values as forbidden target-code imports too; they are not the minimal boot-wrapper exception
- define any needed request builders, tiny response schemas, and side-effect serializers locally under `src/characterization/support/`
- treat OpenAPI, cassette contents, and protocol-visible payloads as the contract source instead of target-code imports

## Minimum workflow

1. Use the shared Azure and Azure Functions harness to boot the runtime and local topology.
2. Seed and read dependencies through raw SDK or protocol calls owned by the characterization folder, not through imported application model classes or shared runtime helpers.
3. Read back observable side effects from emulators or local dependencies.
4. Write `request.json`, `response.json`, `side-effects.json`, `topology.json`, and `normalization.json`.
5. In `verify` mode, rerun the scenario and compare without mutating the cassette.

For Azure Functions HTTP scenarios, it is fine to confirm that the live capture is success-shaped before writing a happy-path cassette. After that, keep `verify` focused on comparing normalized request/response/side-effect layers to the stored cassette; do not add extra payload-shape matchers alongside the cassette comparison.

Use `/admin/functions/<name>` as a diagnostic seam, not as the default trigger seam for characterization. It is useful for surfacing runtime failures quickly, but queue, broker, timer, and blob scenarios should still prefer the real trigger transport when the local topology can drive it honestly.

## Queue-trigger characterization

For queue-trigger payload quirks (base64 encoding, poison queues, MessageEncoding), see `references/azure-functions-harness.md`.

If `func start` or an equivalent honest runtime cannot boot and the only remaining path is importing the exported function wrapper or handler directly, stop and report record-replay blocked. That narrower seam belongs to integration, not characterization.

If the harness is test-runner-driven, prefer doing the one-time `build` in the explicit `record` and `verify` scripts rather than inside the test body or the host wrapper. Keep the characterization test opt-in so the repository's default fast test suite does not start the full local topology by accident.
If the suite uses Vitest, apply the shared-container lifecycle from `references/shared-vitest-lifecycle.md` here and keep explicit `record` / `verify` scripts separate from shared dependency startup.

## Starter snippet: cassette helper

This is the smallest useful helper shape for multilayer cassette files:

```ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const cassetteRoot = path.join(__dirname, "..", "cassettes");

export const sortJson = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, sortJson(nested)]),
    );
  }
  return value;
};

const cassetteFile = (scenario: string, fileName: string) =>
  path.join(cassetteRoot, scenario, fileName);

export const writeScenarioCassette = async (
  scenario: string,
  layers: Record<string, unknown>,
) => {
  await Promise.all(
    Object.entries(layers).map(async ([fileName, payload]) => {
      await mkdir(path.dirname(cassetteFile(scenario, fileName)), {
        recursive: true,
      });
      await writeFile(
        cassetteFile(scenario, fileName),
        `${JSON.stringify(sortJson(payload), null, 2)}\n`,
        "utf8",
      );
    }),
  );
};

export const readScenarioLayer = async (scenario: string, fileName: string) =>
  JSON.parse(await readFile(cassetteFile(scenario, fileName), "utf8"));
```

Keep the helper boring and deterministic. It should normalize and persist data, not decide what the scenario means.

## What to record in `topology.json`

For Azure Functions, keep `topology.json` focused on replayable facts:

- host base URL after normalization
- app runtime identity after normalization, such as boot command or image tag
- dependency families used, such as Azurite or Cosmos emulator
- feature flags or local-only compatibility seams that affect the scenario

Do not dump full process environments or ephemeral container internals.

## Common failure modes

### Happy path records a 500

Do not keep it as the "happy" cassette. Adjust the topology, seed data, or scenario selection until the response is actually success-shaped.

### Happy path records a 400

Often the harness is fine and the fixture is not. Check schema validators, documented minimum lengths, required headers, allowed recipient relationships, or other request constraints before recording the cassette.
