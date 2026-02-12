
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env.COSMOS_ENDPOINT || "http://cosmos-db:8081";
const key =
	process.env.COSMOS_KEY ||
	"C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";

const client = new CosmosClient({ endpoint, key, connectionPolicy: { enableEndpointDiscovery: false } });

// Databases and their containers with specific partition keys
const databases = [
	{
		id: "backoffice",
		containers: [
			{ id: "api-keys", partitionPath: "/institutionId" },
			{ id: "api-keys-by-id", partitionPath: "/id" },
			{ id: "consents", partitionPath: "/institutionId" },
			{ id: "issuers", partitionPath: "/institutionId" },
		],
	},
	{
		id: "issuer",
		containers: [
			{ id: "dossiers", partitionPath: "/issuerId" },
			{ id: "issuers", partitionPath: "/subscriptionId" },
			{ id: "issuers-by-subscription-id", partitionPath: "/id" },
			{ id: "issuers-by-vat-number", partitionPath: "/id" },
			{ id: "issuers-whitelist", partitionPath: "/id" },
			{ id: "signature-requests", partitionPath: "/issuerId" },
			{ id: "uploads", partitionPath: "/id" },
		],
	},
	{
		id: "user",
		containers: [
			{ id: "signature-requests", partitionPath: "/signerId" },
			{ id: "signatures", partitionPath: "/signerId" },
		],
	},
];

const DEFAULT_PARTITION_PATH = "/id";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function createDatabaseAndContainers(dbDef) {
	const { id: dbId, containers } = dbDef;
	try {
		const { database } = await client.databases.createIfNotExists({ id: dbId });
		console.log(`Database '${dbId}' ready.`);

		for (const containerDef of containers) {
			const containerId = containerDef.id || containerDef;
			const partitionPath = containerDef.partitionPath || DEFAULT_PARTITION_PATH;
			try {
				await database.containers.createIfNotExists(
					{
						id: containerId,
						partitionKey: { paths: [partitionPath], kind: "Hash" },
					},
					{ offerThroughput: 400 }
				);
				console.log(`  Container '${containerId}' (partition: '${partitionPath}') created in DB '${dbId}'.`);
			} catch (innerErr) {
				console.error(`  Error creating container '${containerId}' in DB '${dbId}':`, innerErr.message || innerErr);
			}
		}
	} catch (err) {
		console.error(`Error creating/reading database '${dbId}':`, err.message || err);
		throw err;
	}
}

async function main() {
	const maxAttempts = 30;
	const delayMs = 2000;
	let attempt = 0;

	while (attempt < maxAttempts) {
		try {
			// quick call to check emulator availability
			await client.database("" + databases[0].id).read();
			// If read doesn't throw, connection works (or DB exists).
			break;
		} catch (err) {
			// Cosmos emulator returns 404 for read when DB doesn't exist; that's fine.
			// We just want to verify the emulator is responding.
			if (err.code === 404) {
				console.log("Cosmos emulator is reachable (Database not found yet).");
				break;
			}
			const isNetworkErr = /ENOTFOUND|ECONNREFUSED|ECONNRESET|certificate|CERT_|EPROTO/i.test((err && err.code) || err.message || "");
			attempt++;
			if (attempt >= maxAttempts) {
				console.error("Cosmos emulator not reachable after retries, giving up.");
				throw err;
			}
			console.log(`Waiting for Cosmos emulator (${attempt}/${maxAttempts})... reason: ${err.code || err.message}`);
			await sleep(delayMs);
		}
	}

	// Create databases and containers
	for (const dbDef of databases) {
		try {
			await createDatabaseAndContainers(dbDef);
		} catch (err) {
			console.error(`Failed to provision DB '${dbDef.id}':`, err.message || err);
		}
	}

	console.log("Cosmos provisioning finished.");
}

main().catch((err) => {
	console.error("setup-cosmos-containers.js failed:", err.message || err);
	process.exit(1);
});

