import * as E from "fp-ts/lib/Either";
import { identity, pipe } from "fp-ts/lib/function";

import { CosmosClient } from "@azure/cosmos";
import { ContainerClient } from "@azure/storage-blob";

import { makeCreateDossierAzureFunction } from "../infra/azure/functions/create-dossier";
import { makeCreateSignatureRequestAzureFunction } from "../infra/azure/functions/create-signature-request";
import { makeGetDossierAzureFunction } from "../infra/azure/functions/get-dossier";
import { makeGetSignatureRequestAzureFunction } from "../infra/azure/functions/get-signature-request";
import { makeGetSignerByFiscalCodeAzureFunction } from "../infra/azure/functions/get-signer";
import { makeGetUploadUrlAzureFunction } from "../infra/azure/functions/get-upload-url";
import { makeSetSignatureRequestStatusAzureFunction } from "../infra/azure/functions/set-signature-request-status";
import { makeValidateUploadAzureFunction } from "../infra/azure/functions/validate-upload";
import { getConfigFromEnvironment } from "./config";

const configOrError = pipe(
  getConfigFromEnvironment(process.env),
  E.getOrElseW(identity)
);

if (configOrError instanceof Error) {
  throw configOrError;
}

const config = configOrError;

const cosmosClient = new CosmosClient(config.azure.cosmos.connectionString);
const db = cosmosClient.database(config.azure.cosmos.dbName);

const getContainerClient = (containerName: string) =>
  new ContainerClient(config.azure.storage.connectionString, containerName);

const uploadedContainerClient = getContainerClient("uploaded-documents");
const validatedContainerClient = getContainerClient("validated-documents");

export const GetSignerByFiscalCode = makeGetSignerByFiscalCodeAzureFunction();

export const CreateDossier = makeCreateDossierAzureFunction(db);

export const GetDossier = makeGetDossierAzureFunction(db);

export const CreateSignatureRequest =
  makeCreateSignatureRequestAzureFunction(db);

export const GetSignatureRequest = makeGetSignatureRequestAzureFunction(db);

export const SetSignatureRequestStatus =
  makeSetSignatureRequestStatusAzureFunction(db);

export const GetUploadUrl = makeGetUploadUrlAzureFunction(
  db,
  uploadedContainerClient
);

export const ValidateUpload = makeValidateUploadAzureFunction(
  db,
  uploadedContainerClient,
  validatedContainerClient
);
