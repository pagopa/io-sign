import { describe, it, expect, beforeAll } from "vitest";

import {
  writeScenarioCassette,
  readScenarioLayer,
  scenarioExists
} from "./support/cassettes";
import { normalizeHeaders, redactSecrets } from "./support/normalize";

const SCENARIO_NAME = "get-qtsp-clauses-metadata";
const IS_RECORD = process.env.TEST_MODE === "record";

/**
 * Characterization test for GET /api/v1/sign/qtsp/clauses
 *
 * Record mode: boots a containerized Functions host, calls the QTSP clauses
 * endpoint (which in turn calls the Namirial stub), and writes cassettes.
 *
 * Verify mode: replays the same flow and compares against stored cassettes.
 *
 * NOTE: This test requires Docker with platform emulation (linux/amd64)
 * and a pre-built `dist/` directory. Run `pnpm build` before recording.
 */
describe("GET /qtsp/clauses characterization", () => {
  let functionBaseUrl: string;

  beforeAll(() => {
    functionBaseUrl = process.env.__TEST_FUNCTION_HOST_URL__ ?? "";
  });

  it("should record/verify GET qtsp clauses metadata", async () => {
    if (functionBaseUrl) {
      const response = await fetch(
        `${functionBaseUrl}/api/v1/sign/qtsp/clauses`,
        {
          method: "GET",
          headers: {
            "x-iosign-issuer-environment": "TEST",
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
            path: "/api/v1/sign/qtsp/clauses",
            headers: { "x-iosign-issuer-environment": "TEST" }
          }),
          "response.json": {
            statusCode: response.status,
            headers: normalizeHeaders(responseHeaders),
            body: responseBody
          },
          "topology.json": {
            hostBaseUrl: "<FUNCTION_HOST>",
            dependencies: ["namirial-stub"],
            scenario: "GET QTSP clauses metadata via Namirial"
          },
          "normalization.json": {
            removedHeaders: [
              "date",
              "x-ms-request-id",
              "etag",
              "x-request-id"
            ],
            redacted: ["x-functions-key", "authorization"],
            notes:
              "Response from Namirial stub is deterministic; no field replacement needed"
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
          body: responseBody
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
  });
});
