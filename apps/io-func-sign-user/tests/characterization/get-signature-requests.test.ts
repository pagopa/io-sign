import { describe, it, expect, beforeAll } from "vitest";
import { CosmosClient, Database } from "@azure/cosmos";

import { COSMOS_EMULATOR_KEY } from "../support/cosmos";
import {
  makeTestSignatureRequest,
  makeTestDocumentReady
} from "../support/fixtures";
import {
  writeScenarioCassette,
  readScenarioLayer,
  scenarioExists
} from "./support/cassettes";
import { normalizeDocument, normalizeHeaders, redactSecrets } from "./support/normalize";

const SCENARIO_NAME = "get-signature-requests";
const IS_RECORD = process.env.TEST_MODE === "record";

/**
 * Characterization test for GET /api/v1/sign/signature-requests
 *
 * Record mode: boots a containerized Functions host, seeds Cosmos with
 * multiple signature requests for one signer, calls the list endpoint,
 * and writes cassettes.
 *
 * Verify mode: replays the same flow and compares against stored cassettes.
 *
 * NOTE: This test requires Docker with platform emulation (linux/amd64)
 * and a pre-built `dist/` directory. Run `pnpm build` before recording.
 */
describe("GET /signature-requests (list) characterization", () => {
  let database: Database;
  let functionBaseUrl: string;

  const signerId = "01HYR8X5T7N8KBQR0XCMJZLIST";
  const requestId1 = "01HYR8X5T7N8KBQR0XCMJZLS01";
  const requestId2 = "01HYR8X5T7N8KBQR0XCMJZLS02";

  beforeAll(async () => {
    const cosmosClient = new CosmosClient({
      endpoint: process.env.__TEST_COSMOS_ENDPOINT__!,
      key: COSMOS_EMULATOR_KEY,
      connectionPolicy: { enableEndpointDiscovery: false }
    });
    database = cosmosClient.database("io-sign-test");
    functionBaseUrl = process.env.__TEST_FUNCTION_HOST_URL__ ?? "";
  });

  it("should record/verify GET signature requests list", async () => {
    const sigReqContainer = database.container("signature-requests");

    const request1 = makeTestSignatureRequest({
      id: requestId1,
      signerId,
      status: "WAIT_FOR_SIGNATURE",
      documents: [makeTestDocumentReady({ id: "doc-list-001" })]
    });
    const request2 = makeTestSignatureRequest({
      id: requestId2,
      signerId,
      status: "SIGNED",
      documents: [makeTestDocumentReady({ id: "doc-list-002" })]
    });

    await sigReqContainer.items.upsert(request1);
    await sigReqContainer.items.upsert(request2);

    try {
      if (functionBaseUrl) {
        const response = await fetch(
          `${functionBaseUrl}/api/v1/sign/signature-requests`,
          {
            method: "GET",
            headers: {
              "x-iosign-signer-id": signerId,
              "x-functions-key": "master"
            }
          }
        );

        const responseBody = await response.json();
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        if (IS_RECORD) {
          expect(response.status).toBe(200);
          expect(responseBody.items).toBeDefined();
          expect(responseBody.items.length).toBeGreaterThanOrEqual(2);

          const normalizedItems = (responseBody.items as Record<string, unknown>[])
            .map((item) => normalizeDocument(item))
            .sort((a, b) =>
              String(a.id ?? "").localeCompare(String(b.id ?? ""))
            );

          const cassette = {
            "request.json": redactSecrets({
              method: "GET",
              path: "/api/v1/sign/signature-requests",
              headers: { "x-iosign-signer-id": signerId }
            }),
            "response.json": {
              statusCode: response.status,
              headers: normalizeHeaders(responseHeaders),
              body: { items: normalizedItems }
            },
            "topology.json": {
              hostBaseUrl: "<FUNCTION_HOST>",
              dependencies: ["cosmos-emulator", "azurite"],
              scenario: "GET signature requests list by signer"
            },
            "normalization.json": {
              removedHeaders: [
                "date",
                "x-ms-request-id",
                "etag",
                "x-request-id"
              ],
              replacedFields: {
                _etag: "cosmos metadata",
                _rid: "cosmos metadata",
                _self: "cosmos metadata",
                _ts: "cosmos metadata",
                createdAt: "timestamp",
                updatedAt: "timestamp",
                expiresAt: "timestamp"
              },
              sortedArrays: ["items"],
              redacted: ["x-functions-key", "authorization"]
            }
          };

          await writeScenarioCassette(SCENARIO_NAME, cassette);
        } else {
          const storedResponse = await readScenarioLayer(
            SCENARIO_NAME,
            "response.json"
          );

          const normalizedItems = (responseBody.items as Record<string, unknown>[])
            .map((item) => normalizeDocument(item))
            .sort((a, b) =>
              String(a.id ?? "").localeCompare(String(b.id ?? ""))
            );

          const liveResponse = {
            statusCode: response.status,
            headers: normalizeHeaders(responseHeaders),
            body: { items: normalizedItems }
          };
          expect(liveResponse).toEqual(storedResponse);
        }
      } else {
        if (!IS_RECORD) {
          const exists = await scenarioExists(SCENARIO_NAME, "response.json");
          if (exists) {
            const stored = await readScenarioLayer(
              SCENARIO_NAME,
              "response.json"
            );
            expect(stored.statusCode).toBe(200);
            expect(stored.body.items).toBeDefined();
          } else {
            console.warn(
              `[characterization] No cassette found for "${SCENARIO_NAME}". ` +
                "Run with TEST_MODE=record and a Docker-enabled environment first."
            );
          }
        }
      }
    } finally {
      await sigReqContainer.item(requestId1, signerId).delete();
      await sigReqContainer.item(requestId2, signerId).delete();
    }
  });
});
