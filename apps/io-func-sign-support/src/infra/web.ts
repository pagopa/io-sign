import { CosmosClient } from "@azure/cosmos";

import * as E from "fp-ts/Either";
import { identity, pipe } from "fp-ts/function";

import { createPdvTokenizerClient } from "@io-sign/io-sign/infra/pdv-tokenizer/client";

import { getConfigFromEnvironment } from "../app/config";

import { CosmosDbIssuerRepository } from "./azure/cosmos/issuer";
import { CosmosDbSignatureRequestRepository } from "./azure/cosmos/signature-request";
import { PdvTokenizerSignerRepository } from "./pagopa/pdv-tokenizer/signer";

import { GetSignatureRequestFunction } from "./azure/functions/get-signature-request";
import { InfoFunction } from "./azure/functions/info";

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

export const GetSignatureRequest = GetSignatureRequestFunction({
  issuerRepository,
  signatureRequestRepository,
  signerRepository
});

export const Info = InfoFunction({});
