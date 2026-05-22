import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { CosmosClient, Database } from "@azure/cosmos";
import {
  createServer as createHttpsServer,
  Server as HttpsServer
} from "node:https";
import { request as httpRequest } from "node:http";
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const COSMOS_EMULATOR_IMAGE =
  "mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview";

export const COSMOS_EMULATOR_KEY =
  "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";

export interface CosmosHarness {
  container: StartedTestContainer;
  client: CosmosClient;
  database: Database;
  connectionString: string;
  endpoint: string;
  proxy: HttpsServer;
}

export async function startCosmos(): Promise<CosmosHarness> {
  const container = await new GenericContainer(COSMOS_EMULATOR_IMAGE)
    .withExposedPorts(8080, 8081)
    .withEnvironment({
      AZURE_COSMOS_EMULATOR_ENABLE_DATA_PERSISTENCE: "false"
    })
    .withStartupTimeout(120_000)
    .withWaitStrategy(Wait.forHttp("/", 8080).forStatusCode(200))
    .start();

  const host = container.getHost();
  const httpPort = container.getMappedPort(8081);

  // Start HTTPS proxy to satisfy the Cosmos SDK's HTTPS requirement
  const proxy = await startHttpsProxy(host, httpPort);
  const endpoint = proxy.endpoint;
  const connectionString = `AccountEndpoint=${endpoint};AccountKey=${COSMOS_EMULATOR_KEY};`;

  const client = new CosmosClient({
    endpoint,
    key: COSMOS_EMULATOR_KEY,
    connectionPolicy: { enableEndpointDiscovery: false }
  });

  // Warm up: prove the emulator is truly ready
  await warmUpCosmos(client);

  const { database } = await client.databases.createIfNotExists({
    id: "io-sign-test"
  });

  // Create the containers the app needs
  await database.containers.createIfNotExists({
    id: "signature-requests",
    partitionKey: { paths: ["/signerId"] }
  });
  await database.containers.createIfNotExists({
    id: "signatures",
    partitionKey: { paths: ["/signerId"] }
  });

  return {
    container,
    client,
    database,
    connectionString,
    endpoint,
    proxy: proxy.server
  };
}

export async function stopCosmos(harness: CosmosHarness): Promise<void> {
  if (harness.proxy) {
    harness.proxy.close();
  }
  await harness.container.stop();
}

/**
 * Generates a self-signed cert for the local HTTPS proxy using openssl CLI.
 */
function generateSelfSignedCert(): { key: string; cert: string } {
  const tmp = mkdtempSync(join(tmpdir(), "cosmos-proxy-"));
  const keyFile = join(tmp, "key.pem");
  const certFile = join(tmp, "cert.pem");
  execSync(
    `openssl req -x509 -newkey rsa:2048 -keyout ${keyFile} -out ${certFile} -days 1 -nodes -subj "/CN=localhost" 2>/dev/null`
  );
  const key = readFileSync(keyFile, "utf-8");
  const cert = readFileSync(certFile, "utf-8");
  rmSync(tmp, { recursive: true });
  return { key, cert };
}

/**
 * Starts a local HTTPS proxy that forwards requests to the HTTP Cosmos emulator.
 * This bridges the gap: the Azure Cosmos SDK requires HTTPS, but the
 * vnext-preview emulator only serves HTTP on ARM64.
 */
async function startHttpsProxy(
  targetHost: string,
  targetPort: number
): Promise<{ server: HttpsServer; port: number; endpoint: string }> {
  const { key, cert } = generateSelfSignedCert();

  const server = createHttpsServer({ key, cert }, (clientReq, clientRes) => {
    const proxyReq = httpRequest(
      {
        hostname: targetHost,
        port: targetPort,
        path: clientReq.url,
        method: clientReq.method,
        headers: { ...clientReq.headers, host: `${targetHost}:${targetPort}` }
      },
      (proxyRes) => {
        clientRes.writeHead(proxyRes.statusCode ?? 500, proxyRes.headers);
        proxyRes.pipe(clientRes);
      }
    );
    proxyReq.on("error", () => clientRes.destroy());
    clientReq.pipe(proxyReq);
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const port = (server.address() as any).port;
  const endpoint = `https://127.0.0.1:${port}`;
  return { server, port, endpoint };
}

async function warmUpCosmos(client: CosmosClient): Promise<void> {
  for (let attempt = 1; attempt <= 15; attempt++) {
    try {
      const { database } = await client.databases.createIfNotExists({
        id: `probe-${Date.now()}`
      });
      const { container } = await database.containers.createIfNotExists({
        id: "probe",
        partitionKey: { paths: ["/pk"] }
      });
      await container.items.upsert({
        id: "probe-item",
        pk: "probe",
        ready: true
      });
      await container.item("probe-item", "probe").read();
      await container.items.query("SELECT * FROM c").fetchAll();
      await database.delete();
      return;
    } catch {
      if (attempt === 15) {
        throw new Error("Cosmos emulator warm-up failed after 15 attempts");
      }
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }
  }
}
