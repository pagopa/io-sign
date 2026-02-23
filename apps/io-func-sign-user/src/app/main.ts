import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
  app
} from "@azure/functions";
import { ContainerClient } from "@azure/storage-blob";
import { QueueClient } from "@azure/storage-queue";
import { createPdvTokenizerClient } from "@io-sign/io-sign/infra/pdv-tokenizer/client";

import * as E from "fp-ts/lib/Either";
import { identity, pipe } from "fp-ts/lib/function";

import { CosmosClient } from "@azure/cosmos";
import { createIOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";

import { makeGenerateSignatureRequestQrCode } from "@io-sign/io-sign/infra/io-link/qr-code";
import { EventHubProducerClient } from "@azure/event-hubs";
import { SignatureRequestCancelled } from "@io-sign/io-sign/signature-request";
import { InfoHandler } from "../infra/http/handlers/info";
import { makeCreateFilledDocumentFunction } from "../infra/azure/functions/create-filled-document";
import { makeFillDocumentFunction } from "../infra/azure/functions/fill-document";
import { makeGetSignerByFiscalCodeFunction } from "../infra/azure/functions/get-signer-by-fiscal-code";
import { GetQtspClausesMetadataFunction } from "../infra/azure/functions/get-qtsp-clauses-metadata";
import { makeCreateSignatureFunction } from "../infra/azure/functions/create-signature";
import { makeCreateSignatureRequestFunction } from "../infra/azure/functions/create-signature-request";
import { makeValidateSignatureFunction } from "../infra/azure/functions/validate-signature";
import { makeGetThirdPartyMessageDetailsFunction } from "../infra/azure/functions/get-third-party-message-details";
import { makeGetThirdPartyMessageAttachmentContentFunction } from "../infra/azure/functions/get-third-party-message-attachments-content";
import { createLollipopApiClient } from "../infra/lollipop/client";
import { GetSignatureRequestsFunction } from "../infra/azure/functions/get-signature-requests";
import { CosmosDbSignatureRequestRepository } from "../infra/azure/cosmos/signature-request";
import { GetSignatureRequestFunction } from "../infra/azure/functions/get-signature-request";
import { UpdateSignatureRequestFunction } from "../infra/azure/functions/update-signature-request";
import { getConfigFromEnvironment } from "./config";

interface V3Context {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  req: HttpRequest;
  res?: HttpResponseInit;
  done: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log: (...args: any[]) => void;
}

const v3ToV4Adapter =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (v3Handler: any) =>
    async (
      request: HttpRequest,
      context: InvocationContext
    ): Promise<HttpResponseInit> => {
      const v3Context: V3Context = {
        ...context,
        req: request,
        res: undefined,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        done: () => {},
        log: context.log,
        // handler-kit-legacy's isHttpTriggeredFunctionContext reads this array
        // to verify the context belongs to an HTTP trigger; v4 InvocationContext
        // doesn't carry it, so we inject a minimal valid definition.
        bindingDefinitions: [
          { name: "req", type: "httpTrigger", direction: "in" },
          { name: "$return", type: "http", direction: "out" }
        ]
      };

      await v3Handler(v3Context, request);

      return v3Context.res || { status: 500, body: "Internal Server Error" };
    };

const configOrError = pipe(
  getConfigFromEnvironment(process.env),
  E.getOrElseW(identity)
);

if (configOrError instanceof Error) {
  throw configOrError;
}

const config = configOrError;

const cosmosClient = new CosmosClient(config.azure.cosmos.connectionString);
const database = cosmosClient.database(config.azure.cosmos.dbName);

const eventHubAnalyticsClient = new EventHubProducerClient(
  config.azure.eventHubs.analyticsConnectionString,
  "analytics"
);

const filledContainerClient = new ContainerClient(
  config.azure.storage.connectionString,
  "filled-modules"
);

const documentsToFillQueue = new QueueClient(
  config.azure.storage.connectionString,
  "waiting-for-documents-to-fill"
);

const qtspQueue = new QueueClient(
  config.azure.storage.connectionString,
  "waiting-for-qtsp"
);

const onWaitForSignatureQueueClient = new QueueClient(
  config.azure.storage.connectionString,
  "on-signature-request-wait-for-signature"
);

const onSignedQueueClient = new QueueClient(
  config.azure.storage.connectionString,
  "on-signature-request-signed"
);

const onRejectedQueueClient = new QueueClient(
  config.azure.storage.connectionString,
  "on-signature-request-rejected"
);

const validatedContainerClient = new ContainerClient(
  config.azure.storage.connectionString,
  "validated-documents"
);

const signedContainerClient = new ContainerClient(
  config.azure.storage.connectionString,
  "signed-documents"
);

const pdvTokenizerClient = createPdvTokenizerClient(
  config.pagopa.tokenizer.basePath,
  config.pagopa.tokenizer.apiKey
);

const ioApiClient = createIOApiClient(
  config.pagopa.ioServices.basePath,
  config.pagopa.ioServices.subscriptionKey
);

const lollipopApiClient = createLollipopApiClient(
  config.pagopa.lollipop.apiBasePath,
  config.pagopa.lollipop.apiKey
);

const generateSignatureRequestQrCode = makeGenerateSignatureRequestQrCode(
  config.pagopa.ioLink
);

const signatureRequestRepository = new CosmosDbSignatureRequestRepository(
  database
);

const info = httpAzureFunction(InfoHandler)({
  namirialConfig: config.namirial,
  pdvTokenizerClient,
  ioApiClient,
  lollipopApiClient,
  db: database,
  filledContainerClient,
  validatedContainerClient,
  signedContainerClient,
  documentsToFillQueue,
  qtspQueue,
  onWaitForSignatureQueueClient
});

app.http("info", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "info",
  handler: info
});

const getSignatureRequests = GetSignatureRequestsFunction({
  signatureRequestRepository
});

app.http("getSignatureRequests", {
  methods: ["GET"],
  authLevel: "function",
  route: "signature-requests",
  handler: getSignatureRequests
});

const getSignatureRequest = GetSignatureRequestFunction({
  signatureRequestRepository,
  validatedContainerClient,
  signedContainerClient
});

app.http("getSignatureRequest", {
  methods: ["GET"],
  authLevel: "function",
  route: "signature-requests/{signatureRequestId}",
  handler: getSignatureRequest
});

const updateSignatureRequest = UpdateSignatureRequestFunction({
  signatureRequestRepository,
  inputDecoder: SignatureRequestCancelled,
  eventAnalyticsClient: eventHubAnalyticsClient
});

app.storageQueue("updateSignatureRequest", {
  queueName: "waiting-for-signature-request-updates",
  connection: "StorageAccountConnectionString",
  handler: updateSignatureRequest
});

const createSignature = makeCreateSignatureFunction(
  pdvTokenizerClient,
  lollipopApiClient,
  database,
  qtspQueue,
  validatedContainerClient,
  signedContainerClient,
  config.namirial
);

app.http("createSignature", {
  methods: ["POST"],
  authLevel: "function",
  route: "signatures",
  handler: v3ToV4Adapter(createSignature)
});

const createSignatureRequest = makeCreateSignatureRequestFunction(
  database,
  onWaitForSignatureQueueClient,
  generateSignatureRequestQrCode
);

app.storageQueue("createSignatureRequest", {
  queueName: "on-signature-request-ready",
  connection: "StorageAccountConnectionString",
  handler: createSignatureRequest
});

const getSignerByFiscalCode = makeGetSignerByFiscalCodeFunction(
  pdvTokenizerClient,
  ioApiClient
);

app.http("getSignerByFiscalCode", {
  methods: ["POST"],
  authLevel: "function",
  route: "signers",
  handler: v3ToV4Adapter(getSignerByFiscalCode)
});

const getQtspClausesMetadata = GetQtspClausesMetadataFunction(config.namirial);

app.http("getQtspClausesMetadata", {
  methods: ["GET"],
  authLevel: "function",
  route: "qtsp/clauses",
  handler: getQtspClausesMetadata
});

const createFilledDocument = makeCreateFilledDocumentFunction(
  filledContainerClient,
  documentsToFillQueue,
  pdvTokenizerClient
);

app.http("createFilledDocument", {
  methods: ["POST"],
  authLevel: "function",
  route: "qtsp/clauses/filled_document",
  handler: v3ToV4Adapter(createFilledDocument)
});

const getThirdPartyMessageDetails = makeGetThirdPartyMessageDetailsFunction(
  pdvTokenizerClient,
  database
);

app.http("getThirdPartyMessageDetails", {
  methods: ["GET"],
  authLevel: "function",
  route: "messages/{signatureRequestId}",
  handler: v3ToV4Adapter(getThirdPartyMessageDetails)
});

const getThirdPartyMessageAttachmentContent =
  makeGetThirdPartyMessageAttachmentContentFunction(
    pdvTokenizerClient,
    database,
    signedContainerClient
  );

app.http("getThirdPartyMessageAttachmentContent", {
  methods: ["GET"],
  authLevel: "function",
  route: "messages/{signatureRequestId}/{documentId}",
  handler: v3ToV4Adapter(getThirdPartyMessageAttachmentContent)
});

const fillDocument = makeFillDocumentFunction(
  pdvTokenizerClient,
  filledContainerClient
);

app.storageQueue("fillDocument", {
  queueName: "waiting-for-documents-to-fill",
  connection: "StorageAccountConnectionString",
  handler: fillDocument
});

const validateSignature = makeValidateSignatureFunction(
  database,
  signedContainerClient,
  config.namirial,
  onSignedQueueClient,
  onRejectedQueueClient,
  eventHubAnalyticsClient
);

app.storageQueue("validateSignature", {
  queueName: "waiting-for-qtsp",
  connection: "StorageAccountConnectionString",
  handler: validateSignature
});
