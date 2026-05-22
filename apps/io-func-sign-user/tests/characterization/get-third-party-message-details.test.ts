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

const SCENARIO_NAME = "get-third-party-message-details";
const IS_RECORD = process.env.TEST_MODE === "record";

/**
 * Characterization test for GET /api/v1/sign/messages/{signatureRequestId}
 *
 * Record mode: boots a containerized Functions host, seeds Cosmos with a
 * SIGNED signature request, calls the third-party message details endpoint
 * (which resolves the fiscal code via PDV stub → signerId → Cosmos lookup),
 * and writes cassettes.
 *
 * Verify mode: replays the same flow and compares against stored cassettes.
 *
 * NOTE: This test requires Docker with platform emulation (linux/amd64)
 * and a pre-built `dist/` directory. Run `pnpm build` before recording.
 */
describe("GET /messages/{id} third-party message details characterization", () => {
  let database: Database;
  let functionBaseUrl: string;

  // The PDV stub returns "pdv-signer-token-id" for any fiscal code lookup
  const signerId = "pdv-signer-token-id";
  const signatureRequestId = "01HYR8X5T7N8KBQR0XCMJZ3PM1";
  // The PDV stub resolves any token to this fiscal code
  const fiscalCode = "RSSMRA80A01H501U";

  beforeAll(async () => {
    const cosmosClient = new CosmosClient({
      endpoint: process.env.__TEST_COSMOS_ENDPOINT__!,
      key: COSMOS_EMULATOR_KEY,
      connectionPolicy: { enableEndpointDiscovery: false }
    });
    database = cosmosClient.database("io-sign-test");
    functionBaseUrl = process.env.__TEST_FUNCTION_HOST_URL__ ?? "";
  });

  it("should record/verify GET third-party message details for SIGNED request", async () => {
    const sigReqContainer = database.container("signature-requests");

    // Seed a SIGNED signature request that the PDV stub's signer can access
    const signatureRequest = makeTestSignatureRequest({
      id: signatureRequestId,
      signerId,
      status: "SIGNED",
      documents: [
        makeTestDocumentReady({
          id: "doc-3pm-001",
          metadata: {
            title: "Signed Contract",
            signatureFields: [
              {
                attributes: { uniqueName: "sig_field_1" },
                clause: { title: "Signing clause", type: "REQUIRED" }
              }
            ],
            pdfDocumentMetadata: {
              pages: [{ number: 0, width: 595, height: 842 }],
              formFields: [{ type: "PDFSignature", name: "sig_field_1" }]
            }
          }
        })
      ]
    });

    await sigReqContainer.items.upsert(signatureRequest);

    try {
      if (functionBaseUrl) {
        const response = await fetch(
          `${functionBaseUrl}/api/v1/sign/messages/${signatureRequestId}`,
          {
            method: "GET",
            headers: {
              fiscal_code: fiscalCode,
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
          expect(responseBody).toBeDefined();

          const cassette = {
            "request.json": redactSecrets({
              method: "GET",
              path: `/api/v1/sign/messages/${signatureRequestId}`,
              headers: { fiscal_code: fiscalCode }
            }),
            "response.json": {
              statusCode: response.status,
              headers: normalizeHeaders(responseHeaders),
              body: normalizeDocument(responseBody)
            },
            "topology.json": {
              hostBaseUrl: "<FUNCTION_HOST>",
              dependencies: [
                "cosmos-emulator",
                "pdv-tokenizer-stub"
              ],
              scenario:
                "GET third-party message details for SIGNED signature request"
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
              redacted: ["x-functions-key", "authorization"]
            }
          };

          await writeScenarioCassette(SCENARIO_NAME, cassette);
        } else {
          const storedResponse = await readScenarioLayer(
            SCENARIO_NAME,
            "response.json"
          );
          const liveResponse = {
            statusCode: response.status,
            headers: normalizeHeaders(responseHeaders),
            body: normalizeDocument(responseBody)
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
            expect(stored.body).toBeDefined();
          } else {
            console.warn(
              `[characterization] No cassette found for "${SCENARIO_NAME}". ` +
                "Run with TEST_MODE=record and a Docker-enabled environment first."
            );
          }
        }
      }
    } finally {
      await sigReqContainer.item(signatureRequestId, signerId).delete();
    }
  });
});
