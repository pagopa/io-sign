import { CosmosHarness, startCosmos, stopCosmos } from "./cosmos";
import { AzuriteHarness, startAzurite, stopAzurite } from "./azurite";
import { StubServer, startStubServer, createRoutingHandler } from "./stubs";
import {
  namirialStubHandler,
  pdvTokenizerStubHandler,
  lollipopStubHandler,
  ioServicesStubHandler
} from "./fixtures";

export interface TestHarness {
  cosmos: CosmosHarness;
  azurite: AzuriteHarness;
  stubs: StubServer;
  env: Record<string, string>;
}

// Valid ULID for IoServicesConfigurationId
const TEST_ULID = "01HYQE4YB7N8KBQR0XCMJZ1234";

// Syntactically valid Event Hub connection string (lazy — never actually connects)
const FAKE_EVENT_HUB_CONNECTION_STRING =
  "Endpoint=sb://fake.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=dGVzdA==";

export async function startHarness(): Promise<TestHarness> {
  const [cosmos, azurite, stubs] = await Promise.all([
    startCosmos(),
    startAzurite(),
    startStubServer(
      createRoutingHandler({
        "/namirial": namirialStubHandler,
        "/pdv": pdvTokenizerStubHandler,
        "/lollipop": lollipopStubHandler,
        "/io-services": ioServicesStubHandler
      })
    )
  ]);

  const env: Record<string, string> = {
    NODE_TLS_REJECT_UNAUTHORIZED: "0",
    FUNCTIONS_WORKER_RUNTIME: "node",
    AzureWebJobsStorage: azurite.connectionString,
    CosmosDbConnectionString: cosmos.connectionString,
    CosmosDbDatabaseName: "io-sign-test",
    StorageAccountConnectionString: azurite.connectionString,
    StorageAccountItnConnectionString: azurite.connectionString,
    IoServicesApiBasePath: `${stubs.baseUrl}/io-services`,
    IoServicesSubscriptionKey: "test-subscription-key",
    IoServicesConfigurationId: TEST_ULID,
    PdvTokenizerApiBasePath: `${stubs.baseUrl}/pdv`,
    PdvTokenizerApiKey: "test-pdv-key",
    NamirialApiBasePath: `${stubs.baseUrl}/namirial`,
    NamirialUsername: "test-namirial-user",
    NamirialPassword: "test-namirial-pass",
    NamirialTestApiBasePath: `${stubs.baseUrl}/namirial`,
    NamirialTestUsername: "test-namirial-user",
    NamirialTestPassword: "test-namirial-pass",
    LollipopApiBasePath: `${stubs.baseUrl}/lollipop`,
    LollipopApiKey: "test-lollipop-key",
    AnalyticsEventHubItnConnectionString: FAKE_EVENT_HUB_CONNECTION_STRING,
    BillingEventHubItnConnectionString: FAKE_EVENT_HUB_CONNECTION_STRING,
    AnalyticsEventHubConnectionString: FAKE_EVENT_HUB_CONNECTION_STRING,
    BillingEventHubConnectionString: FAKE_EVENT_HUB_CONNECTION_STRING,
    IoLinkBaseUrl: "https://continua.io.pagopa.it"
  };

  return { cosmos, azurite, stubs, env };
}

export async function stopHarness(harness: TestHarness): Promise<void> {
  await Promise.all([
    stopCosmos(harness.cosmos),
    stopAzurite(harness.azurite),
    harness.stubs.stop()
  ]);
}
