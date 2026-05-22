/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { beforeAll, describe, expect, it } from "vitest";
import { CosmosClient, Database } from "@azure/cosmos";
import { ContainerClient } from "@azure/storage-blob";
import { QueueClient, QueueServiceClient } from "@azure/storage-queue";
import { EventHubProducerClient } from "@azure/event-hubs";
import { InvocationContext } from "@azure/functions";

import { COSMOS_EMULATOR_KEY } from "../support/cosmos";
import {
  makeTestDocumentReady,
  makeTestSignature,
  makeTestSignatureRequest
} from "../support/fixtures";

// eslint-disable-next-line max-lines-per-function
describe("ValidateSignature integration", () => {
  let database: Database;
  let signedContainerClient: ContainerClient;
  let onSignedQueueClient: QueueClient;
  let onRejectedQueueClient: QueueClient;
  let eventHubClient: EventHubProducerClient;
  let stubsBaseUrl: string;

  beforeAll(async () => {
    const azuriteConnectionString =
      process.env.__TEST_AZURITE_CONNECTION_STRING__!;
    stubsBaseUrl = process.env.__TEST_STUBS_BASE_URL__!;

    const cosmosClient = new CosmosClient({
      endpoint: process.env.__TEST_COSMOS_ENDPOINT__!,
      key: COSMOS_EMULATOR_KEY,
      connectionPolicy: { enableEndpointDiscovery: false }
    });
    database = cosmosClient.database("io-sign-test");

    // Create blob container for signed documents
    signedContainerClient = new ContainerClient(
      azuriteConnectionString,
      "signed-documents"
    );
    await signedContainerClient.createIfNotExists();

    // Create queue clients
    const queueService = QueueServiceClient.fromConnectionString(
      azuriteConnectionString
    );
    onSignedQueueClient = queueService.getQueueClient(
      "on-signature-request-signed"
    );
    onRejectedQueueClient = queueService.getQueueClient(
      "on-signature-request-rejected"
    );
    await onSignedQueueClient.createIfNotExists();
    await onRejectedQueueClient.createIfNotExists();

    // Event Hub client (fire-and-forget, will fail gracefully)
    const fakeEhConnStr =
      "Endpoint=sb://fake.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=dGVzdA==";
    eventHubClient = new EventHubProducerClient(fakeEhConnStr, "analytics");
  });

  it("should mark signature request as SIGNED when QTSP returns COMPLETED", async () => {
    // Arrange: seed Cosmos with a signature request + signature
    const signerId = generateId();
    const signatureRequestId = generateId();
    const signatureId = generateId();
    const qtspSignatureRequestId = generateId();
    const documentId = generateId();

    const document = makeTestDocumentReady({ id: documentId });
    const signatureRequest = makeTestSignatureRequest({
      id: signatureRequestId,
      signerId,
      status: "WAIT_FOR_QTSP",
      documents: [document]
    });

    const signature = makeTestSignature({
      id: signatureId,
      signerId,
      signatureRequestId,
      qtspSignatureRequestId,
      status: "WAITING"
    });

    // Insert into Cosmos
    const sigReqContainer = database.container("signature-requests");
    const sigContainer = database.container("signatures");
    await sigReqContainer.items.upsert(signatureRequest);
    await sigContainer.items.upsert(signature);

    // Upload a dummy blob to simulate a signed document
    const blobClient = signedContainerClient.getBlockBlobClient(documentId);
    await blobClient.upload("fake-pdf-content", 16);

    // Import the handler (after env is set by global-setup)
    const { ValidateSignatureFunction } = await import(
      "../../src/infra/azure/functions/validate-signature"
    );
    const { ValidateSignaturePayload } = await import(
      "../../src/app/use-cases/validate-signature"
    );

    const handler = ValidateSignatureFunction({
      db: database,
      signedContainerClient,
      qtspConfig: {
        prod: {
          basePath: `${stubsBaseUrl}/namirial`,
          username: "test-user",
          password: "test-pass"
        },
        test: {
          basePath: `${stubsBaseUrl}/namirial`,
          username: "test-user",
          password: "test-pass"
        },
        requestTimeoutMs: 5000
      },
      onSignedQueueClient,
      onRejectedQueueClient,
      eventHubAnalyticsClient: eventHubClient,
      legacyEventHubAnalyticsClient: eventHubClient,
      inputDecoder: ValidateSignaturePayload
    });

    const context = new InvocationContext({
      functionName: "validateSignature"
    });

    // Act
    const payload = { signatureId, signerId };
    await handler(payload, context);

    // Assert: signature request should be SIGNED
    const { resource: updatedRequest } = await sigReqContainer
      .item(signatureRequestId, signerId)
      .read();
    expect(updatedRequest.status).toBe("SIGNED");
    expect(updatedRequest.signedAt).toBeDefined();

    // Assert: signature should be COMPLETED
    const { resource: updatedSignature } = await sigContainer
      .item(signatureId, signerId)
      .read();
    expect(updatedSignature.status).toBe("COMPLETED");

    // Assert: signed notification was queued
    const signedMessages = await onSignedQueueClient.receiveMessages({
      numberOfMessages: 1
    });
    expect(signedMessages.receivedMessageItems.length).toBe(1);

    // Cleanup
    await sigReqContainer.item(signatureRequestId, signerId).delete();
    await sigContainer.item(signatureId, signerId).delete();
    await blobClient.delete();
    await onSignedQueueClient.clearMessages();
    await onRejectedQueueClient.clearMessages();
  });

  it("should mark signature request as REJECTED when QTSP returns FAILED", async () => {
    const signerId = generateId();
    const signatureRequestId = generateId();
    const signatureId = generateId();
    const qtspSignatureRequestId = "qtsp-failed-id";

    const signatureRequest = makeTestSignatureRequest({
      id: signatureRequestId,
      signerId,
      status: "WAIT_FOR_QTSP"
    });

    const signature = makeTestSignature({
      id: signatureId,
      signerId,
      signatureRequestId,
      qtspSignatureRequestId,
      status: "WAITING"
    });

    const sigReqContainer = database.container("signature-requests");
    const sigContainer = database.container("signatures");
    await sigReqContainer.items.upsert(signatureRequest);
    await sigContainer.items.upsert(signature);

    // Import after env is set
    const { ValidateSignatureFunction } = await import(
      "../../src/infra/azure/functions/validate-signature"
    );
    const { ValidateSignaturePayload } = await import(
      "../../src/app/use-cases/validate-signature"
    );

    // Override stub to return FAILED for this specific request
    const { startStubServer } = await import("../support/stubs");
    const failStub = await startStubServer((req) => {
      if (req.url?.includes("/token")) {
        return {
          status: 200,
          body: { access: "test-token", refresh: "test-refresh" }
        };
      }
      return {
        status: 200,
        body: {
          id: qtspSignatureRequestId,
          created_at: new Date().toISOString(),
          status: "FAILED",
          last_error: { code: 500, detail: "Signature creation failed at QTSP" }
        }
      };
    });

    try {
      const handler = ValidateSignatureFunction({
        db: database,
        signedContainerClient,
        qtspConfig: {
          prod: {
            basePath: failStub.baseUrl,
            username: "u",
            password: "p"
          },
          test: {
            basePath: failStub.baseUrl,
            username: "u",
            password: "p"
          },
          requestTimeoutMs: 5000
        },
        onSignedQueueClient,
        onRejectedQueueClient,
        eventHubAnalyticsClient: eventHubClient,
        legacyEventHubAnalyticsClient: eventHubClient,
        inputDecoder: ValidateSignaturePayload
      });

      const context = new InvocationContext({
        functionName: "validateSignature"
      });
      await handler({ signatureId, signerId }, context);

      // Assert: signature request should be REJECTED
      const { resource: updatedRequest } = await sigReqContainer
        .item(signatureRequestId, signerId)
        .read();
      expect(updatedRequest.status).toBe("REJECTED");
      expect(updatedRequest.rejectReason).toBe(
        "Signature creation failed at QTSP"
      );

      // Assert: rejected notification was queued
      const rejectedMessages = await onRejectedQueueClient.receiveMessages({
        numberOfMessages: 1
      });
      expect(rejectedMessages.receivedMessageItems.length).toBe(1);
    } finally {
      await failStub.stop();
      await sigReqContainer.item(signatureRequestId, signerId).delete();
      await sigContainer.item(signatureId, signerId).delete();
      await onSignedQueueClient.clearMessages();
      await onRejectedQueueClient.clearMessages();
    }
  });
});

function generateId(): string {
  return [...Array(26)]
    .map(
      () => "0123456789ABCDEFGHJKMNPQRSTVWXYZ"[Math.floor(Math.random() * 32)]
    )
    .join("");
}
