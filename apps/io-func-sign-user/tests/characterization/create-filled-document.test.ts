import { describe, it, expect, beforeAll } from "vitest";

import {
  writeScenarioCassette,
  readScenarioLayer,
  scenarioExists
} from "./support/cassettes";
import {
  normalizeHeaders,
  normalizeUrl,
  redactSecrets
} from "./support/normalize";

const SCENARIO_NAME = "create-filled-document";
const IS_RECORD = process.env.TEST_MODE === "record";

/**
 * Characterization test for POST /api/v1/sign/qtsp/clauses/filled_document
 *
 * Record mode: boots a containerized Functions host, sends a create-filled-document
 * request (exercising Blob SAS generation, Queue notification, and PDV tokenizer),
 * and writes cassettes.
 *
 * Verify mode: replays the same flow and compares against stored cassettes.
 *
 * NOTE: This test requires Docker with platform emulation (linux/amd64)
 * and a pre-built `dist/` directory. Run `pnpm build` before recording.
 */
describe("POST /qtsp/clauses/filled_document characterization", () => {
  let functionBaseUrl: string;

  const signerId = "01HYR8X5T7N8KBQR0XCMJZFILL";

  beforeAll(() => {
    functionBaseUrl = process.env.__TEST_FUNCTION_HOST_URL__ ?? "";
  });

  it("should record/verify POST create filled document", async () => {
    if (functionBaseUrl) {
      const requestBody = {
        document_url: "https://example.com/documents/tos-document.pdf",
        email: "signer@test.pagopa.it",
        family_name: "Rossi",
        name: "Mario"
      };

      const response = await fetch(
        `${functionBaseUrl}/api/v1/sign/qtsp/clauses/filled_document`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-iosign-signer-id": signerId,
            "x-functions-key": "master"
          },
          body: JSON.stringify(requestBody)
        }
      );

      const responseBody = await response.json();
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      if (IS_RECORD) {
        expect(response.status).toBe(201);
        expect(responseBody).toBeDefined();

        const normalizedBody: Record<string, unknown> = { ...responseBody };
        // Normalize the filled_document_url which contains a SAS token
        if (typeof normalizedBody.filled_document_url === "string") {
          normalizedBody.filled_document_url = normalizeUrl(
            normalizedBody.filled_document_url
          );
        }

        const normalizedHeaders = normalizeHeaders(responseHeaders);
        // Normalize the Location header which also contains a SAS URL
        if (normalizedHeaders.location) {
          normalizedHeaders.location = normalizeUrl(normalizedHeaders.location);
        }

        const cassette = {
          "request.json": redactSecrets({
            method: "POST",
            path: "/api/v1/sign/qtsp/clauses/filled_document",
            headers: { "x-iosign-signer-id": signerId },
            body: requestBody
          }),
          "response.json": {
            statusCode: response.status,
            headers: normalizedHeaders,
            body: normalizedBody
          },
          "topology.json": {
            hostBaseUrl: "<FUNCTION_HOST>",
            dependencies: [
              "azurite-blob",
              "azurite-queue",
              "pdv-tokenizer-stub"
            ],
            scenario: "POST create filled document with SAS URL"
          },
          "normalization.json": {
            removedHeaders: [
              "date",
              "x-ms-request-id",
              "etag",
              "x-request-id"
            ],
            replacedFields: {
              filled_document_url: "SAS URL normalized to path only",
              location: "SAS URL normalized to path only"
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

        const normalizedBody: Record<string, unknown> = { ...responseBody };
        if (typeof normalizedBody.filled_document_url === "string") {
          normalizedBody.filled_document_url = normalizeUrl(
            normalizedBody.filled_document_url
          );
        }

        const normalizedHeaders = normalizeHeaders(responseHeaders);
        if (normalizedHeaders.location) {
          normalizedHeaders.location = normalizeUrl(normalizedHeaders.location);
        }

        const liveResponse = {
          statusCode: response.status,
          headers: normalizedHeaders,
          body: normalizedBody
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
          expect(stored.statusCode).toBe(201);
          expect(stored.body).toBeDefined();
        } else {
          console.warn(
            `[characterization] No cassette found for "${SCENARIO_NAME}". ` +
              "Run with TEST_MODE=record and a Docker-enabled environment first."
          );
        }
      }
    }
  });
});
