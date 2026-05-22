import { TestHarness, startHarness, stopHarness } from "./support/harness";

let harness: TestHarness | undefined;

export async function setup() {
  // Must be set BEFORE any Azure SDK client is created (TLS with emulator)
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  harness = await startHarness();

  // Surface connection info for debugging
  console.log("[global-setup] Cosmos endpoint:", harness.cosmos.endpoint);
  console.log("[global-setup] Azurite blob:", harness.azurite.blobEndpoint);
  console.log("[global-setup] Azurite queue:", harness.azurite.queueEndpoint);
  console.log("[global-setup] Stubs base URL:", harness.stubs.baseUrl);

  // Provide harness data to tests via environment variables
  // Vitest globalSetup can provide data through serializable values
  process.env.__TEST_COSMOS_CONNECTION_STRING__ =
    harness.cosmos.connectionString;
  process.env.__TEST_COSMOS_ENDPOINT__ = harness.cosmos.endpoint;
  process.env.__TEST_AZURITE_CONNECTION_STRING__ =
    harness.azurite.connectionString;
  process.env.__TEST_AZURITE_BLOB_ENDPOINT__ = harness.azurite.blobEndpoint;
  process.env.__TEST_AZURITE_QUEUE_ENDPOINT__ = harness.azurite.queueEndpoint;
  process.env.__TEST_STUBS_BASE_URL__ = harness.stubs.baseUrl;

  // Set all app env vars so handlers can be imported
  for (const [key, value] of Object.entries(harness.env)) {
    process.env[key] = value;
  }

  return () => teardown();
}

async function teardown() {
  if (harness) {
    await stopHarness(harness);
    harness = undefined;
  }
}
