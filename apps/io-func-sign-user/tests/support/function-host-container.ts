import {
  GenericContainer,
  StartedNetwork,
  StartedTestContainer,
  Wait
} from "testcontainers";
import { resolve } from "node:path";

const FUNCTIONS_IMAGE = "mcr.microsoft.com/azure-functions/node:4-node20";

export interface FunctionHostContainer {
  container: StartedTestContainer;
  network: StartedNetwork;
  baseUrl: string;
  masterKey: string;
}

/**
 * Starts the Azure Functions app in a containerized runtime using the official image.
 * Uses platform emulation (linux/amd64) on ARM hosts.
 */
export async function startFunctionHostContainer(opts: {
  appDir: string;
  env: Record<string, string>;
  cosmosNetworkAlias: string;
  cosmosPort: number;
  azuriteNetworkAlias: string;
  azuriteBlobPort: number;
  azuriteQueuePort: number;
  network: StartedNetwork;
}): Promise<FunctionHostContainer> {
  const {
    appDir,
    env,
    network,
    cosmosNetworkAlias,
    cosmosPort,
    azuriteNetworkAlias,
    azuriteBlobPort,
    azuriteQueuePort
  } = opts;

  // Build the internal connection strings for the container network
  const internalCosmosEndpoint = `https://${cosmosNetworkAlias}:${cosmosPort}`;
  const internalAzuriteBlob = `http://${azuriteNetworkAlias}:${azuriteBlobPort}/devstoreaccount1`;
  const internalAzuriteQueue = `http://${azuriteNetworkAlias}:${azuriteQueuePort}/devstoreaccount1`;
  const internalAzuriteConnStr = [
    "DefaultEndpointsProtocol=http",
    "AccountName=devstoreaccount1",
    "AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==",
    `BlobEndpoint=${internalAzuriteBlob}`,
    `QueueEndpoint=${internalAzuriteQueue}`
  ].join(";");

  const cosmosKey =
    "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";
  const internalCosmosConnStr = `AccountEndpoint=${internalCosmosEndpoint};AccountKey=${cosmosKey};`;

  const containerEnv: Record<string, string> = {
    ...env,
    AzureWebJobsStorage: internalAzuriteConnStr,
    CosmosDbConnectionString: internalCosmosConnStr,
    StorageAccountConnectionString: internalAzuriteConnStr,
    StorageAccountItnConnectionString: internalAzuriteConnStr,
    AzureWebJobsSecretStorageType: "files"
  };

  const distDir = resolve(appDir, "dist");
  const hostJsonPath = resolve(appDir, "host.json");

  const container = await new GenericContainer(FUNCTIONS_IMAGE)
    .withExposedPorts(80)
    .withNetwork(network)
    .withNetworkAliases("func-host")
    .withEnvironment(containerEnv)
    .withCopyDirectoriesToContainer([
      { source: distDir, target: "/home/site/wwwroot/dist" }
    ])
    .withCopyFilesToContainer([
      { source: hostJsonPath, target: "/home/site/wwwroot/host.json" },
      {
        source: resolve(appDir, "package.json"),
        target: "/home/site/wwwroot/package.json"
      }
    ])
    .withStartupTimeout(180_000)
    .withWaitStrategy(Wait.forListeningPorts())
    .start();

  const host = container.getHost();
  const port = container.getMappedPort(80);
  const baseUrl = `http://${host}:${port}`;

  // When using file-based secrets, the master key is "master" by default
  const masterKey = "master";

  // Wait for the host to be truly ready
  await waitForReady(baseUrl);

  return { container, network, baseUrl, masterKey };
}

export async function stopFunctionHostContainer(
  host: FunctionHostContainer
): Promise<void> {
  await host.container.stop();
}

async function waitForReady(baseUrl: string, maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${baseUrl}/api/v1/sign/info`);
      if (res.ok || res.status === 401) {
        return;
      }
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("Function host never became ready");
}
