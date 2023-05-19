import { describe, test, expect } from "vitest";

import * as fs from "node:fs";
import * as path from "node:path";

import * as H from "@pagopa/handler-kit";

import * as E from "fp-ts/lib/Either";

import { requireFilesForValidation } from "../document-validation";

const BOUNDARY = "--TESTBOUNDARY";

type Part = [
  "text/plain" | "application/pdf" | "application/json",
  string,
  Buffer
];

const multipartRequest = (...parts: Part[]) => ({
  ...H.request("http://localhost"),
  headers: {
    "content-type": `multipart/form-data; boundary=${BOUNDARY}`,
  },
  body: Buffer.from(
    parts
      .map(
        ([mime, filename, data]) =>
          `--${BOUNDARY}\r\nContent-Disposition: form-data; name="uploads[]"; filename="${filename}";\r\nContent-Type: ${mime}\r\n\r\n${data.toString()}`
      )
      .join("\r\n") + `\r\n--${BOUNDARY}--`
  ),
});

const samplePdf = fs.readFileSync(path.join(__dirname, "sample.pdf"));

describe("requireFilesForValidation", () => {
  test("http request with wrong files in body", async () => {
    const requests = [
      multipartRequest(),
      multipartRequest([
        "text/plain",
        "hello.txt",
        Buffer.from("hello from a wrong file!"),
      ]),
      multipartRequest(
        ["application/pdf", "document.pdf", samplePdf],
        ["application/json", "fields.json", Buffer.from(JSON.stringify({}))]
      ),
      multipartRequest([
        "application/json",
        "fields.json",
        Buffer.from(JSON.stringify({})),
      ]),
    ];
    const results = await Promise.all(
      requests.map((req) => requireFilesForValidation(req)())
    );
    expect(results.every((result) => E.isLeft(result))).toBe(true);
  });
  test("well formed http request", async () => {
    const validPdfFile = ["application/pdf", "document.pdf", samplePdf] as Part;
    const validSignatureFields = [
      "application/json",
      "fields.json",
      Buffer.from(
        JSON.stringify([
          {
            clause: {
              title: "clause 1",
              type: "REQUIRED",
            },
            attrs: {
              unique_name: "Signature1",
            },
          },
          {
            clause: {
              title: "clause 2",
              type: "REQUIRED",
            },
            attrs: {
              unique_name: "Signature2",
            },
          },
        ])
      ),
    ] as Part;
    const requests = [
      multipartRequest(validPdfFile, validSignatureFields),
      multipartRequest(validSignatureFields, validPdfFile),
      multipartRequest(validPdfFile),
    ];
    const results = await Promise.all(
      requests.map((req) => requireFilesForValidation(req)())
    );
    expect(results.every((result) => E.isRight(result))).toBe(true);
  });
  test("http request with invalid signature fields", async () => {
    const req = multipartRequest(
      ["application/pdf", "document.pdf", samplePdf],
      [
        "application/json",
        "fields.json",
        Buffer.from(JSON.stringify({ fields: "invalid" })),
      ]
    );
    const result = await requireFilesForValidation(req)();
    expect(E.isLeft(result)).toBe(true);
  });
  test("http request with an invalid pdf document (invalid = not a pdf)", async () => {
    const req = multipartRequest(
      ["application/pdf", "document.pdf", Buffer.from(`i'm not a pdf!`)],
      ["application/json", "fields.json", Buffer.from(JSON.stringify([]))]
    );
    const result = await requireFilesForValidation(req)();
    expect(E.isLeft(result)).toBe(true);
  });
});
