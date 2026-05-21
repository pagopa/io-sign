# Azure Functions live integration additions

> Prerequisites: read `references/azure-harness.md` and `references/azure-functions-harness.md` first. This file adds integration-specific guidance on top of the shared Azure Functions harness.

## Recommended layout

Keep the integration folder close to the target app and separate runtime helpers from scenario assertions.

```text
src/
  integration/
    live/
      <scenario>.test.ts
    support/
      function-host.ts
      harness.ts
      stubs.ts
      cleanup.ts
```

If the repo already has an `integration/` or equivalent test folder, keep that naming. The important part is the separation:

- `*.test.ts` drives the real scenario
- `function-host.ts` or `app-runtime.ts` owns starting or attaching to the real Functions runtime
- `harness.ts` owns Testcontainers-managed dependencies, seed data, and read-back helpers
- `stubs.ts` owns outbound partner HTTP stubs

For Vitest-based suites, see `references/shared-vitest-lifecycle.md` for the shared-container lifecycle layout.

## Integration-specific workflow

On top of the shared Azure and Azure Functions harness:

1. Seed and read dependencies through raw SDK or protocol calls owned by the integration folder, not through mock helpers.
2. Assert on the live response and the side effects that matter to the contract.
3. Keep the suite focused on durable contract behavior rather than helper-call mechanics.

If the harness is test-runner-driven, prefer doing the one-time `build` in the explicit integration test command rather than inside every test body.

## Prefer the real trigger transport for non-HTTP flows

When the scenario is queue-, blob-, timer-, or broker-triggered, prefer driving it through the real local trigger transport whenever the topology can do that honestly.

- Use `/admin/functions/<name>` as a diagnostic seam to surface runtime failures quickly, not as the default seam for ongoing trigger coverage.
- If the real queue or blob trigger is available locally, keep the integration test at that boundary even when admin invocation looks easier.
- Treat a working admin invocation plus a broken real trigger as a harness bug still worth fixing, not as evidence that the narrower seam is "good enough."

For queue-trigger payload quirks (base64, poison queues, encoding), see `references/azure-functions-harness.md`.

## Binding-output slice snippet

When the contract is "this Function emits the correct queue, blob, or table output" and booting the full host would mostly repeat framework setup, assert through a real `InvocationContext` instead of spies.

```ts
const queueOutput = output.storageQueue({
  connection: "AzureWebJobsStorage",
  queueName: "example-queue",
});
const context = new InvocationContext();

await handler(input, context);

expect(context.extraOutputs.get(queueOutput)).toEqual(expectedPayload);
```

Use this style only when the emitted binding payload is the contract you care about and the full host would add noise rather than confidence.

For general assertion style, follow `references/integration-workflow.md`; this file only adds Azure Functions-specific layout and harness guidance.

## Good final shape

A good Azure Functions live integration suite usually has:

- one explicit way to boot the host
- shared emulator containers when Vitest is available
- per-test disposable resources
- local partner HTTP stubs where needed
- assertions on the real response and real side effects

That gives you integration confidence without turning the suite into a record-replay harness by accident.
