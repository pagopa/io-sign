import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";

const AZURITE_IMAGE = "mcr.microsoft.com/azure-storage/azurite";

export const AZURITE_ACCOUNT_NAME = "devstoreaccount1";
export const AZURITE_ACCOUNT_KEY =
  "Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==";

export interface AzuriteHarness {
  container: StartedTestContainer;
  connectionString: string;
  blobEndpoint: string;
  queueEndpoint: string;
}

export async function startAzurite(): Promise<AzuriteHarness> {
  const container = await new GenericContainer(AZURITE_IMAGE)
    .withExposedPorts(10000, 10001, 10002)
    .withStartupTimeout(60_000)
    .withWaitStrategy(Wait.forListeningPorts())
    .start();

  const host = container.getHost();
  const blobPort = container.getMappedPort(10000);
  const queuePort = container.getMappedPort(10001);

  const blobEndpoint = `http://${host}:${blobPort}/${AZURITE_ACCOUNT_NAME}`;
  const queueEndpoint = `http://${host}:${queuePort}/${AZURITE_ACCOUNT_NAME}`;

  const connectionString = [
    `DefaultEndpointsProtocol=http`,
    `AccountName=${AZURITE_ACCOUNT_NAME}`,
    `AccountKey=${AZURITE_ACCOUNT_KEY}`,
    `BlobEndpoint=http://${host}:${blobPort}/${AZURITE_ACCOUNT_NAME}`,
    `QueueEndpoint=http://${host}:${queuePort}/${AZURITE_ACCOUNT_NAME}`
  ].join(";");

  return { container, connectionString, blobEndpoint, queueEndpoint };
}

export async function stopAzurite(harness: AzuriteHarness): Promise<void> {
  await harness.container.stop();
}
