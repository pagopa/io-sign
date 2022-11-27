import { ContainerClient } from "@azure/storage-blob";
import { getConfigOrThrow } from "../../../app/config";

const config = getConfigOrThrow();

export const uploadedContainerClient = new ContainerClient(
  config.azure.storage.connectionString,
  config.uploadedStorageContainerName
);
