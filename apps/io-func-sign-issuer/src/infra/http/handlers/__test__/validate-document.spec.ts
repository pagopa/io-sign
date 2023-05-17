import { describe, beforeEach, test, expect } from "vitest";

import * as fs from "node:fs";
import * as path from "node:path";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import * as H from "@pagopa/handler-kit";

import { Issuer } from "@io-sign/io-sign/issuer";
import { newId } from "@io-sign/io-sign/id";

import { validateDocumentHandler } from "../validate-document";
import { DocumentValidationResult } from "../../models/DocumentValidationResult";

const samplePdf = fs.readFileSync(path.join(__dirname, "sample.pdf"));

const issuer: Issuer = {
  id: newId(),
  subscriptionId: newId(),
  email: "issuer.test@mail.pagopa.it" as EmailString,
  description: "issuer used in unit tests" as NonEmptyString,
  internalInstitutionId: newId(),
  environment: "TEST",
  vatNumber: "14711371128" as NonEmptyString,
  department: "dep1" as NonEmptyString,
};

const mocks = { issuer };

type ValidateDocumentTestContext = {
  call: (
    req: H.HttpRequest
  ) => TE.TaskEither<
    Error,
    H.HttpResponse<DocumentValidationResult | H.ProblemJson, H.HttpStatusCode>
  >;
};

const buildMultipartBody = (
  boundary: string,
  pdfContent: Buffer,
  fields: Buffer
) => {
  const parts = [
    ["document", "doc.pdf", "application/pdf", pdfContent],
    ["fields", "fields.json", "application/json", fields],
  ];
  const encoded = parts
    .map(
      ([name, filename, mime, data]) =>
        `--${boundary}\r\ncontent-disposition: form-data; name="${name}"; filename="${filename}"\r\ncontent-type: ${mime}\r\n\r\n${data.toString()}`
    )
    .join("\r\n");
  return Buffer.from(`${encoded}\r\n--${boundary}--`);
};

describe("validateDocumentHandler", () => {
  beforeEach<ValidateDocumentTestContext>((ctx) => {
    ctx.call = (req: H.HttpRequest) =>
      validateDocumentHandler({
        logger: {
          log: () => () => {},
        },
        issuerRepository: {
          getBySubscriptionId: (subscriptionId) =>
            mocks.issuer.subscriptionId === subscriptionId
              ? TE.right(O.some(mocks.issuer))
              : TE.right(O.none),
          getByVatNumber: () => TE.right(O.none),
        },
        input: req,
        inputDecoder: H.HttpRequest,
      });
  });
  test<ValidateDocumentTestContext>("unauthorized on missing issuer", (ctx) => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-subscription-id": "sub-that-does-not-exists",
      },
    };
    const run = ctx.call(req);
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 401,
          headers: expect.objectContaining({
            "Content-Type": "application/problem+json",
          }),
        }),
      })
    );
  });
  test<ValidateDocumentTestContext>("success with is_valid true on valid files", (ctx) => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-subscription-id": mocks.issuer.subscriptionId,
        "content-type": "multipart/form-data; boundary=TESTB",
      },
      body: buildMultipartBody(
        "TESTB",
        samplePdf,
        Buffer.from(JSON.stringify([]))
      ),
    };
    const run = ctx.call(req);
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 200,
          body: expect.objectContaining({
            is_valid: true,
          }),
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      })
    );
  });
  test<ValidateDocumentTestContext>("success with is_valid false and violations on invalid files", (ctx) => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-subscription-id": mocks.issuer.subscriptionId,
        "content-type": "multipart/form-data; boundary=TESTB",
      },
      body: buildMultipartBody(
        "TESTB",
        samplePdf,
        Buffer.from(
          JSON.stringify([
            {
              clause: {
                title: "clause 1",
                type: "REQUIRED",
              },
              attrs: {
                unique_name: "clause-1",
              },
            },
          ])
        )
      ),
    };
    const run = ctx.call(req);
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 200,
          body: expect.objectContaining({
            is_valid: false,
            violations: expect.arrayContaining([
              `(clause 1) the field "clause-1" was not found is the uploaded document`,
            ]),
          }),
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      })
    );
  });
  test<ValidateDocumentTestContext>("bad request on malformed request (missing files, not valid files)", (ctx) => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-subscription-id": mocks.issuer.subscriptionId,
        "content-type": "multipart/form-data; boundary=XOXO",
      },
      body: Buffer.from(
        `--XOXO\r\ncontent-disposition: form-data; name="file1"; filename="file1.txt;\r\ncontent-type: text/plain\r\n\r\nkisses from an invalid file\r\n--XOXO--`
      ),
    };
    const run = ctx.call(req);
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 400,
          headers: expect.objectContaining({
            "Content-Type": "application/problem+json",
          }),
        }),
      })
    );
  });
});
