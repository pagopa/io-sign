// this script creates the necessary containers, queues in the Azurite storage emulator

const { BlobServiceClient } = require("@azure/storage-blob");
const { QueueServiceClient } = require("@azure/storage-queue");

const connectionString =
  "DefaultEndpointsProtocol=http;" +
  "AccountName=devstoreaccount1;" +
  "AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;" +
  "BlobEndpoint=http://azurite:10000/devstoreaccount1;" +
  "QueueEndpoint=http://azurite:10001/devstoreaccount1;" +
  "TableEndpoint=http://azurite:10002/devstoreaccount1;";

const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString);
const queueServiceClient =
  QueueServiceClient.fromConnectionString(connectionString);

const containers = ["uploaded-documents", "signed-documents","validated-documents"];
const queues = [
  "on-signature-request-ready",
  "waiting-for-signature-request-updates",
  "on-signature-request-wait-for-signature",
  "on-signature-request-signed",
  "on-signature-request-rejected"
];

const createContainerIfNotExists = async (name) => {
  try {
    const containerClient = blobServiceClient.getContainerClient(name);
    await containerClient.createIfNotExists();
    console.log(`Container ${name} created.`);
  } catch (error) {
    console.error(`Error creating container ${name}:`, error);
  }
};

const createQueueIfNotExists = async (name) => {
  try {
    const queueClient = queueServiceClient.getQueueClient(name);
    await queueClient.createIfNotExists();
    console.log(`Queue ${name} created.`);
  } catch (error) {
    console.error(`Error creating queue ${name}:`, error);
  }
};

(async () => {
  await Promise.all([
    ...containers.map(createContainerIfNotExists),
    ...queues.map(createQueueIfNotExists),
  ]);
})();