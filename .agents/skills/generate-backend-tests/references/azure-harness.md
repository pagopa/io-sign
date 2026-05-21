# Azure shared harness starter

> Prerequisites: read `references/shared-harness.md` for generic rules. Read with the runtime-specific Azure reference (e.g. `azure-functions-harness.md`).

Covers Azure-local harness concerns: choosing and wiring local Azure dependencies, emulator-related flags, Cosmos-specific readiness, and observing side effects in Azure-managed dependencies.

## Dependency selection for Azure-local topologies

Pick the lightest local topology that still proves the contract.

| Need                               | Preferred local dependency                                                                                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Blob, queue, or table output       | Azurite or the repository's existing storage emulator, booted through Testcontainers when it runs in a container                                                                     |
| Cosmos-backed read or write path   | Cosmos-compatible emulator or the repository's existing local Cosmos path, booted through Testcontainers when it runs in a container                                                 |
| Azure queue or broker publish path | the repository's existing local queue or broker path, preferably booted through Testcontainers when it runs in a container and only if the scenario truly needs a successful publish |

If a dependency cannot run locally, document the fallback clearly and capture the closest honest local boundary instead of pretending the full side effect ran.

For broker emulators, prove connectivity from both sides of the topology:

- the runtime-side connection the app uses inside the container or network
- the test-side SDK connection the harness uses to seed, publish, or observe side effects from outside that network

Do not assume one connection string or hostname works for both. A broker can be reachable by its in-network alias from the Functions host but require the mapped host and port from the test process.

Use `references/shared-harness.md` for non-Azure dependencies such as partner HTTP stubs or other generic local-runtime wiring.

## Azure-local environment additions

On top of the generic environment validation in `references/shared-harness.md`, verify the Azure-local values the runtime needs to boot and talk to local emulators.

Examples:

- runtime-local settings sources such as `local.settings.json`
- local storage connection settings
- TLS or certificate flags required by local emulators
- Cosmos connection settings
- queue, blob, or table connection settings

## Cosmos emulator quirks worth proving

Use the generic readiness rules from `references/shared-harness.md`, then add these Cosmos-specific checks.

- Validate the exact SDK path the app uses, not just TCP reachability.
- Do not stop at account metadata or a vendor readiness endpoint. Warm the exact database and container path the scenario needs with a real write plus query or readback, then clean the probe data back out.
- Some preview or Linux emulator builds advertise internal endpoints that make queries fail unless `connectionPolicy.enableEndpointDiscovery = false`.
- Prove both point-read and query behavior. Some emulators return enough metadata for direct `item.read()` but omit fields such as `_self` on query results.
- If emulator-specific compatibility logic is needed, keep it in a narrow local seam instead of changing broad production behavior.

### Minimal Cosmos warm-up snippet

Use a real SDK probe after the emulator says it is ready. The point is not the exact helper names; the point is to prove the same client path your tests will use.

```ts
const container = await new GenericContainer(
  "mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview",
)
  .withExposedPorts(8080, 8081)
  .withWaitStrategy(Wait.forHttp("/ready", 8080).forStatusCode(200))
  .start();

const client = new CosmosClient({
  endpoint: `http://${container.getHost()}:${container.getMappedPort(8081)}`,
  key: COSMOS_EMULATOR_KEY,
  connectionPolicy: { enableEndpointDiscovery: false },
});

for (let attempt = 0; attempt < 12; attempt++) {
  try {
    const { database } = await client.databases.createIfNotExists({
      id: "probe-db",
    });
    const { container } = await database.containers.createIfNotExists({
      id: "probe",
      partitionKey: { paths: ["/pk"] },
    });
    await container.items.upsert({
      id: "probe-item",
      pk: "probe",
      ready: true,
    });
    await container.items.query("SELECT * FROM c").fetchAll();
    await database.delete();
    break;
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
```

If this warm-up passes but a higher-level repository or model helper still fails only because of emulator-specific metadata differences, keep the workaround in an integration-only seam instead of broad production changes.

## Observing Azure-managed side effects

When the system writes to queues, blobs, or tables through Azurite or another emulator:

- read the emitted artifact from the emulator rather than spying on internal helper calls
- accept the transport encoding the emulator actually uses
- assert or record the payload that a downstream system would care about

When reading emitted messages from Azurite or another queue emulator, accept both plain JSON and base64-encoded JSON. Compare the emitted payload, not the transport envelope.
