# Azure Functions shared runtime harness

> Prerequisites: read `references/azure-harness.md` first. Covers Azure Functions runtime concerns shared by both integration and record-replay.

## Local Functions boundary

Prefer the real local Functions host or an equivalent containerized Functions runtime.

- Use the same route or trigger seam a real local caller would use.
- Keep the harness pointed at the runtime boundary rather than importing handlers directly.
- Reuse the repository's existing local Functions layout when one already exists.

## Shared Functions bootstrap workflow

1. Start or attach to the real local Functions runtime.
2. If no credible app container exists, allocate a free local port dynamically, build the app with the repository's real build command, and start `func start --port <dynamic-port>` with the current PATH preserved.
3. Wait for readiness by calling a real local Functions route or trigger seam, not just by checking that the port is open.
4. Drive the scenario through the real local Functions boundary.

## When not to force the full host

Sometimes an Azure Functions app constructs cloud clients or validates credentials at import time in ways that do not have a credible local equivalent. In that case, do not bend production code just to make `func start` pass.

- Keep the full host only for scenarios whose contract truly depends on route wiring, middleware, auth, or serialization and can boot honestly.
- Otherwise, for integration work only, use a mixed integration suite: call the real wrapper or handler with real Azure SDK request or context objects, keep storage and queue side effects live, and stub only the truly external dependency.
- This exception does not apply to record-replay characterization. If the user chose `record-replay` and the full host cannot boot honestly, do not import exported functions or wrapper-return values as a fallback; report the path blocked or ask to switch workflows.
- State plainly which scenarios run through the full host and which use narrower live slices, so the user can see the boundary choice was intentional rather than a silent downgrade.

## Functions-specific environment checklist

On top of the generic Azure env validation, verify the settings that are specific to the Functions host.

### Host settings

- `FUNCTIONS_WORKER_RUNTIME`
- `AzureWebJobsStorage`

### Binding settings

Use the same connection names the app already declares in `app.http`, `app.storageQueue`, `app.cosmosDB`, or equivalent binding configuration.

Treat the binding declarations as the source of truth for entity names too, not just connection setting names.

- Read `app.storageQueue(...)`, `app.serviceBusTopic(...)`, `output.storageBlob(...)`, and similar registrations before inventing test resources.
- Resolve `%ENV_NAME%` placeholders through the harness env and keep literal names literal.
- If the app binds to a fixed queue, topic, subscription, blob path, or container, write the test artifact there. Only make resources run-scoped when the binding itself is env-driven or the repository already uses that pattern.
- For fixed queue triggers, create the trigger queue before publishing and, when the local runtime can move invalid payloads to a poison queue, also create the matching `-poison` queue so decode failures stay observable instead of collapsing into harness noise.

Examples:

- queue trigger connection name
- Cosmos trigger connection string setting
- blob or table storage connection setting

## Function-level auth keys

Routes declared with `authLevel: "function"` or `"admin"` reject requests that lack a valid function or host key. When running against a local Functions host backed by Azurite:

- The host writes its master key into Azurite blob storage under `azure-webjobs-secrets/<app-name>/host.json` shortly after startup.
- Poll that blob with retry (the file appears after the host finishes initialization, not immediately on port-open).
- Pass the key as `?code=<key>` or via the `x-functions-key` header.

If the selected scenarios only hit `anonymous` routes, skip this entirely.

This seam is especially useful for lightweight diagnostics through `/admin/functions/<name>`, but do not treat it as the default trigger seam for queue, blob, broker, or timer scenarios that the local topology can drive honestly.

## Trigger isolation for HTTP-focused flows

If the selected scope is one HTTP flow but the app also starts queue, blob, or timer triggers, disable the unrelated functions when they would consume the emitted artifact you want to assert on or record.

- Azure Functions supports this through `AzureWebJobs.<FunctionName>.Disabled=true`.
- This is especially useful when an HTTP request emits a queue message or storage write that must remain observable.

If the workflow persists topology or cassette metadata, keep the disabled-function list there so the resulting harness explains why the output remained observable.

## Queue-trigger payload quirks

Azure Storage queue triggers are easy to mis-shape in local tests. Before simplifying the fixture, confirm what the runtime actually hands to the function.

- Some functions expect the runtime-decoded JSON object.
- Some functions expect queue message text that is itself a base64 string containing JSON because the handler does another decode internally.
- If the host logs `Message decoding has failed! Check MessageEncoding settings.`, treat that as a likely harness mismatch first.
- Create the fixed poison queue too when the runtime may dead-letter invalid payloads locally; otherwise a decode failure can disappear behind an unrelated `QueueNotFound` error.
- Match the real trigger contract even if it means publishing a less convenient encoded message.
- For record-replay, keep encoding details in the local harness or `topology.json` notes rather than normalizing them away.

## Fallback snippet: function host wrapper

Use this only when there is no existing app container or stronger repository convention. This is the smallest useful wrapper around the real local Functions host:

```ts
import { spawn } from "node:child_process";

export class FunctionHost {
  constructor(
    private readonly cwd: string,
    private readonly env: NodeJS.ProcessEnv,
    private readonly port: number,
  ) {}

  get baseUrl() {
    return `http://127.0.0.1:${this.port}/api/`;
  }

  async start() {
    await run("pnpm", ["build"], this.cwd, this.env);
    this.child = spawn("func", ["start", "--port", String(this.port)], {
      cwd: this.cwd,
      env: this.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    // Use the cheapest route available (e.g. /ping or a known lightweight endpoint).
    // Avoid /v1/info or similar health-check routes that fan out to all dependencies —
    // they will hang or timeout until every backing service is fully ready.
    await waitUntilReady(() => fetch(new URL("v1/ping", this.baseUrl)));
  }

  async stop() {
    this.child?.kill("SIGINT");
  }
}
```

The important idea is not the exact code. The important idea is:

- use the real `func start`
- preserve the current environment and PATH
- allocate a free port dynamically instead of hardcoding a shared local port
- capture host logs so failures explain what the runtime actually did
- wait on a real probe — pick the lightest route available; deep health-check endpoints that contact every dependency will hang until the full topology is up
- stop the process cleanly
- keep the harness pointed at the runtime boundary rather than importing it directly

If the selected scenario needs a function or host key, extend this wrapper with a tiny helper that polls `azure-webjobs-secrets/<app-name>/host.json` in Azurite blob storage and passes the retrieved key through `x-functions-key` or `?code=...`.
