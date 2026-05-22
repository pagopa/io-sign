/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { beforeAll, describe, expect, it } from "vitest";
import { CosmosClient, Database } from "@azure/cosmos";
import { ContainerClient } from "@azure/storage-blob";
import { QueueClient, QueueServiceClient } from "@azure/storage-queue";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/function";

import { COSMOS_EMULATOR_KEY } from "../support/cosmos";
import {
  makeTestDocumentReady,
  makeTestSignatureRequest
} from "../support/fixtures";

/**
 * Integration test for the create-signature use case.
 *
 * Boundary: use-case orchestration with real Cosmos + Azurite adapters.
 * This tests the core business flow (create QTSP request, insert signature,
 * mark request as WAIT_FOR_QTSP, notify queue) without the HTTP/lollipop
 * layer which is a separate auth concern tested by unit tests.
 */
// eslint-disable-next-line max-lines-per-function
describe("CreateSignature integration", () => {
  let database: Database;
  let validatedContainerClient: ContainerClient;
  let signedContainerClient: ContainerClient;
  let qtspQueueClient: QueueClient;

  beforeAll(async () => {
    const azuriteConnectionString =
      process.env.__TEST_AZURITE_CONNECTION_STRING__!;

    const cosmosClient = new CosmosClient({
      endpoint: process.env.__TEST_COSMOS_ENDPOINT__!,
      key: COSMOS_EMULATOR_KEY,
      connectionPolicy: { enableEndpointDiscovery: false }
    });
    database = cosmosClient.database("io-sign-test");

    // Create blob containers
    validatedContainerClient = new ContainerClient(
      azuriteConnectionString,
      "validated-documents"
    );
    signedContainerClient = new ContainerClient(
      azuriteConnectionString,
      "signed-documents"
    );
    await validatedContainerClient.createIfNotExists();
    await signedContainerClient.createIfNotExists();

    // Create queue
    const queueService = QueueServiceClient.fromConnectionString(
      azuriteConnectionString
    );
    qtspQueueClient = queueService.getQueueClient("waiting-for-qtsp");
    await qtspQueueClient.createIfNotExists();
  });

  it("should create a signature, mark request as WAIT_FOR_QTSP, and notify queue", async () => {
    // Arrange: seed Cosmos with a WAIT_FOR_SIGNATURE request
    const signerId = generateId();
    const signatureRequestId = generateId();
    const documentId = generateId();

    const doc = makeTestDocumentReady({
      id: documentId,
      url: `https://storage.example.com/validated/${documentId}`
    });
    const signatureRequest = makeTestSignatureRequest({
      id: signatureRequestId,
      signerId,
      status: "WAIT_FOR_SIGNATURE",
      documents: [doc]
    });

    const sigReqContainer = database.container("signature-requests");
    const sigContainer = database.container("signatures");
    await sigReqContainer.items.upsert(signatureRequest);

    // Upload a validated document to Azurite
    const blobClient = validatedContainerClient.getBlockBlobClient(documentId);
    await blobClient.upload("fake-validated-document-content", 33);

    // Import real adapters after env is set
    const { makeGetSignatureRequest, makeUpsertSignatureRequest } =
      await import("../../src/infra/azure/cosmos/signature-request");
    const { makeInsertSignature } = await import(
      "../../src/infra/azure/cosmos/signature"
    );
    const { makeCreateSignature } = await import(
      "../../src/app/use-cases/create-signature"
    );
    const { getDocumentUrl } = await import(
      "@io-sign/io-sign/infra/azure/storage/document-url"
    );
    const { makeNotifySignatureReadyEvent } = await import(
      "../../src/infra/azure/storage/signature"
    );

    // Wire up real adapters
    const getSignatureRequest = makeGetSignatureRequest(database);
    const upsertSignatureRequest = makeUpsertSignatureRequest(database);
    const insertSignature = makeInsertSignature(database);
    const notifySignatureReadyEvent =
      makeNotifySignatureReadyEvent(qtspQueueClient);

    const getDownloadDocumentUrl = (doc: { id: string }) =>
      pipe(doc as any, getDocumentUrl("r", 60))(validatedContainerClient);

    const getUploadSignedDocumentUrl = (doc: { id: string }) =>
      pipe(doc as any, getDocumentUrl("racw", 60))(signedContainerClient);

    // Stub QTSP (Namirial) — returns CREATED
    const creatQtspSignatureRequest = (_env: string) => (_payload: unknown) =>
      TE.right({
        id: "qtsp-new-signature-request-id",
        status: "CREATED" as const,
        last_error: null
      });

    // Stub getFiscalCodeBySignerId (PDV)
    const getFiscalCodeBySignerId = (_signerId: string) =>
      TE.right(O.some("RSSMRA80A01H501U"));

    const createSignature = makeCreateSignature(
      getFiscalCodeBySignerId as any,
      creatQtspSignatureRequest as any,
      insertSignature,
      notifySignatureReadyEvent,
      getSignatureRequest,
      getDownloadDocumentUrl,
      getUploadSignedDocumentUrl,
      upsertSignatureRequest
    );

    // Act: call the use case
    const validPublicKey = Buffer.from(
      JSON.stringify({ kty: "EC", crv: "P-256", x: "abc", y: "def" })
    ).toString("base64");

    const result = await createSignature({
      signatureRequestId,
      signer: { id: signerId },
      qtspClauses: {
        acceptedClauses: [{ text: "I accept" }],
        filledDocumentUrl: "https://example.com/filled-doc.pdf",
        nonce: "test-nonce-value"
      },
      documentsSignature: [
        {
          documentId,
          signatureFields: [
            {
              attrs: {
                uniqueName: "field1"
              },
              clause: { title: "Sign here", type: "REQUIRED" }
            }
          ]
        }
      ],
      email: "signer@test.pagopa.it",
      signatureValidationParams: {
        signatureInput: `sig1=("@method" "@authority");created=1618884475;keyid="test-key"`,
        tosSignature: "tos-sig-value",
        challengeSignature: "challenge-sig-value",
        publicKey: validPublicKey,
        samlAssertionBase64: Buffer.from("saml-assertion").toString("base64")
      }
    } as any)();

    // Assert: the result is a Right (success)
    expect(result).toHaveProperty("_tag", "Right");
    const createdSignature = (result as any).right;
    expect(createdSignature.status).toBe("CREATED");
    expect(createdSignature.signatureRequestId).toBe(signatureRequestId);
    expect(createdSignature.signerId).toBe(signerId);
    expect(createdSignature.qtspSignatureRequestId).toBe(
      "qtsp-new-signature-request-id"
    );

    // Assert: signature request is now WAIT_FOR_QTSP in Cosmos
    const { resource: updatedRequest } = await sigReqContainer
      .item(signatureRequestId, signerId)
      .read();
    expect(updatedRequest.status).toBe("WAIT_FOR_QTSP");

    // Assert: signature was inserted in Cosmos
    const { resources: signatures } = await sigContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.signatureRequestId = @reqId",
        parameters: [{ name: "@reqId", value: signatureRequestId }]
      })
      .fetchAll();
    expect(signatures.length).toBe(1);
    expect(signatures[0].status).toBe("CREATED");

    // Assert: notification was queued (check approximate message count since visibility timeout makes peek unreliable)
    const properties = await qtspQueueClient.getProperties();
    expect(properties.approximateMessagesCount).toBeGreaterThan(0);

    // Cleanup
    await sigReqContainer.item(signatureRequestId, signerId).delete();
    for (const sig of signatures) {
      await sigContainer.item(sig.id, sig.signerId).delete();
    }
    await blobClient.delete();
    await qtspQueueClient.clearMessages();
  });

  it("should reject signature creation when request is already SIGNED", async () => {
    const signerId = generateId();
    const signatureRequestId = generateId();

    const signatureRequest = makeTestSignatureRequest({
      id: signatureRequestId,
      signerId,
      status: "SIGNED",
      signedAt: new Date().toISOString()
    });

    const sigReqContainer = database.container("signature-requests");
    await sigReqContainer.items.upsert(signatureRequest);

    const { makeGetSignatureRequest, makeUpsertSignatureRequest } =
      await import("../../src/infra/azure/cosmos/signature-request");
    const { makeInsertSignature } = await import(
      "../../src/infra/azure/cosmos/signature"
    );
    const { makeCreateSignature } = await import(
      "../../src/app/use-cases/create-signature"
    );
    const { makeNotifySignatureReadyEvent } = await import(
      "../../src/infra/azure/storage/signature"
    );

    const createSignature = makeCreateSignature(
      () => TE.right(O.some("FISCAL_CODE") as any),
      (_env) => (_payload) =>
        TE.right({
          id: "x",
          status: "CREATED" as const,
          last_error: null
        } as any),
      makeInsertSignature(database),
      makeNotifySignatureReadyEvent(qtspQueueClient),
      makeGetSignatureRequest(database),
      () => TE.right("https://download.url"),
      () => TE.right("https://upload.url"),
      makeUpsertSignatureRequest(database)
    );

    const result = await createSignature({
      signatureRequestId,
      signer: { id: signerId },
      qtspClauses: {
        acceptedClauses: [{ text: "I accept" }],
        filledDocumentUrl: "https://example.com/filled-doc.pdf",
        nonce: "nonce"
      },
      documentsSignature: [],
      email: "test@test.it",
      signatureValidationParams: {
        signatureInput: `sig1=("@method");created=1618884475;keyid="k"`,
        tosSignature: "tos",
        challengeSignature: "challenge",
        publicKey: Buffer.from(JSON.stringify({ kty: "EC" })).toString(
          "base64"
        ),
        samlAssertionBase64: "c2FtbA=="
      }
    } as any)();

    // Assert: the result is a Left (failure)
    expect(result).toHaveProperty("_tag", "Left");
    const error = (result as any).left;
    expect(error.message).toContain(
      "Signature can only be created if the signature request is in WAIT_FOR_SIGNATURE or REJECTED status"
    );

    // Cleanup
    await sigReqContainer.item(signatureRequestId, signerId).delete();
  });
});

function generateId(): string {
  return [...Array(26)]
    .map(
      () => "0123456789ABCDEFGHJKMNPQRSTVWXYZ"[Math.floor(Math.random() * 32)]
    )
    .join("");
}
