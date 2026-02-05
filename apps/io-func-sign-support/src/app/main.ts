import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

import * as E from "fp-ts/Either";
import { identity, pipe } from "fp-ts/function";

import { createPdvTokenizerClient } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";

import { getConfigFromEnvironment } from "./config";

import { CosmosDbIssuerRepository } from "../infra/azure/cosmos/issuer";
import { CosmosDbSignatureRequestRepository } from "../infra/azure/cosmos/signature-request";
import { PdvTokenizerSignerRepository } from "../infra/pagopa/pdv-tokenizer/signer";

import { InfoHandler } from "../infra/http/handlers/info";
import { GetSignatureRequestHandler } from "../infra/http/handlers/get-signature-request";

const configOrError = pipe(
  getConfigFromEnvironment(process.env),
  E.getOrElseW(identity)
);

if (configOrError instanceof Error) {
  throw configOrError;
}

const config = configOrError;

const cosmosClient = new CosmosClient(config.azure.cosmos.connectionString);

const issuerDb = cosmosClient.database(config.azure.cosmos.issuerDbName);
const userDb = cosmosClient.database(config.azure.cosmos.userDbName);

const tokenizerClient = createPdvTokenizerClient(
  config.pagopa.tokenizer.basePath,
  config.pagopa.tokenizer.apiKey
);

const issuerRepository = new CosmosDbIssuerRepository(issuerDb);

const signatureRequestRepository = new CosmosDbSignatureRequestRepository(
  userDb,
  issuerDb
);

const signerRepository = new PdvTokenizerSignerRepository(tokenizerClient);

// Info endpoint - health check
const info = httpAzureFunction(InfoHandler)({});

app.http("info", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "info",
  handler: info
});

// Get Signature Request endpoint
const getSignatureRequest = httpAzureFunction(GetSignatureRequestHandler)({
  issuerRepository,
  signatureRequestRepository,
  signerRepository
});

app.http("getSignatureRequest", {
  methods: ["POST"],
  authLevel: "function",
  route: "signature-requests/{id}",
  handler: getSignatureRequest
});
