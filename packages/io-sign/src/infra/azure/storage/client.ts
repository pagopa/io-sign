import { BlobServiceClient } from "@azure/storage-blob";
import { QueueServiceClient } from "@azure/storage-queue";
import type { TokenCredential } from "@azure/core-auth";
import * as L from "@pagopa/logger";
import { ConsoleLogger } from "../../console-logger";
import { StorageConfig } from "./config";

export const makeStorageClients = (
  config: StorageConfig,
  credential?: TokenCredential
) => {
  if (!config.useManagedIdentity) {
    L.info("Creating Storage clients with a connection string")({
      logger: ConsoleLogger
    })();
    return {
      blobService: BlobServiceClient.fromConnectionString(
        config.connectionString
      ),
      queueService: QueueServiceClient.fromConnectionString(
        config.connectionString
      ),
      blobServiceClient: undefined,
      binding: "StorageAccountItnConnectionString"
    };
  }
  if (!credential) {
    throw new Error("A credential is required for managed identity storage");
  }
  L.info("Creating Storage clients with managed identity")({
    logger: ConsoleLogger
  })();
  const blobService = new BlobServiceClient(config.blobServiceUri, credential);
  return {
    blobService,
    queueService: new QueueServiceClient(config.queueServiceUri, credential),
    blobServiceClient: blobService,
    binding: "SIGN_STORAGE"
  };
};
