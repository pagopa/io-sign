import { describe, expect, it, beforeAll } from "vitest";

import * as L from "@pagopa/logger";
import * as H from "@pagopa/handler-kit";

import * as TE from "fp-ts/lib/TaskEither";

import { ContainerClient } from "@azure/storage-blob";
import { QueueClient } from "@azure/storage-queue";

import { newId } from "@io-sign/io-sign/id";
import { EmailString, FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { SignerRepository } from "@io-sign/io-sign/signer";
import {
  ActionNotAllowedError,
  EntityNotFoundError
} from "@io-sign/io-sign/error";
import { GetValidatedEmailByFiscalCode } from "@io-sign/io-sign/infra/io-profile/profile";

import { CreateFilledDocumentHandler } from "../create-filled-document";

describe("CreateFilledDocumentHandler", () => {
  const signer = { id: newId() };
  const fiscalCode = "RSSMRA85T10A562S" as FiscalCode;
  const email = "mario.rossi@test.com" as EmailString;

  let signerRepository: SignerRepository;
  let getValidatedEmailByFiscalCode: GetValidatedEmailByFiscalCode;

  const filledContainerClient = {
    getBlobClient: () => ({
      exists: () => Promise.resolve(true),
      deleteIfExists: () => Promise.resolve({ succeeded: true }),
      generateSasUrl: () =>
        Promise.resolve(`https://blob.test.it/filled/${signer.id}.pdf`)
    })
  } as unknown as ContainerClient;

  const documentsToFillQueue = {
    sendMessage: () =>
      Promise.resolve({ messageId: "message-id", errorCode: undefined })
  } as unknown as QueueClient;

  const logger: L.Logger = {
    log: () => () => {},
    format: L.format.simple
  };

  beforeAll(() => {
    signerRepository = {
      getSignerByFiscalCode: (fc) =>
        fc === fiscalCode
          ? TE.right(signer)
          : TE.left(new EntityNotFoundError("Signer not found")),
      getFiscalCodeBySignerId: () => TE.right(fiscalCode)
    };
    getValidatedEmailByFiscalCode = () => TE.right(email);
  });

  const dependencies = () => ({
    logger,
    input: undefined as unknown,
    inputDecoder: H.HttpRequest,
    filledContainerClient,
    documentsToFillQueue,
    signerRepository,
    getValidatedEmailByFiscalCode
  });

  it("should return a 400 HTTP response when x-iosign-fiscal-code header is missing", async () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-iosign-name": "Mario",
        "x-iosign-family-name": "Rossi"
      },
      body: { document_url: "https://blob.test.it/to-fill.pdf" }
    };
    const run = CreateFilledDocumentHandler({ ...dependencies(), input: req });
    await expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 400,
          headers: expect.objectContaining({
            "Content-Type": "application/problem+json"
          })
        })
      })
    );
  });

  it("should return a 400 HTTP response when x-iosign-name header is missing", async () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-iosign-fiscal-code": fiscalCode,
        "x-iosign-family-name": "Rossi"
      },
      body: { document_url: "https://blob.test.it/to-fill.pdf" }
    };
    const run = CreateFilledDocumentHandler({ ...dependencies(), input: req });
    await expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 400,
          headers: expect.objectContaining({
            "Content-Type": "application/problem+json"
          })
        })
      })
    );
  });

  it("should return a 400 HTTP response when x-iosign-family-name header is missing", async () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-iosign-fiscal-code": fiscalCode,
        "x-iosign-name": "Mario"
      },
      body: { document_url: "https://blob.test.it/to-fill.pdf" }
    };
    const run = CreateFilledDocumentHandler({ ...dependencies(), input: req });
    await expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 400,
          headers: expect.objectContaining({
            "Content-Type": "application/problem+json"
          })
        })
      })
    );
  });

  it("should return a 400 HTTP response when document_url is missing from the body", async () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-iosign-fiscal-code": fiscalCode,
        "x-iosign-name": "Mario",
        "x-iosign-family-name": "Rossi"
      },
      body: {}
    };
    const run = CreateFilledDocumentHandler({ ...dependencies(), input: req });
    await expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 400,
          headers: expect.objectContaining({
            "Content-Type": "application/problem+json"
          })
        })
      })
    );
  });

  it("should return a 500 HTTP response when the signer cannot be found for the given fiscal code (flattened like io-backend)", async () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-iosign-fiscal-code": "AAABBB00A00A000A" as FiscalCode,
        "x-iosign-name": "Mario",
        "x-iosign-family-name": "Rossi"
      },
      body: { document_url: "https://blob.test.it/to-fill.pdf" }
    };
    const run = CreateFilledDocumentHandler({ ...dependencies(), input: req });
    await expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 500,
          headers: expect.objectContaining({
            "Content-Type": "application/problem+json"
          })
        })
      })
    );
  });

  it("should return a 500 HTTP response when the user does not have a validated email address (flattened like io-backend)", async () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-iosign-fiscal-code": fiscalCode,
        "x-iosign-name": "Mario",
        "x-iosign-family-name": "Rossi"
      },
      body: { document_url: "https://blob.test.it/to-fill.pdf" }
    };
    const run = CreateFilledDocumentHandler({
      ...dependencies(),
      input: req,
      getValidatedEmailByFiscalCode: () =>
        TE.left(
          new ActionNotAllowedError(
            "The user does not have a validated email address."
          )
        )
    });
    await expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 500,
          headers: expect.objectContaining({
            "Content-Type": "application/problem+json"
          })
        })
      })
    );
  });

  it("should return a 201 HTTP response with the filled document location on success", async () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-iosign-fiscal-code": fiscalCode,
        "x-iosign-name": "Mario",
        "x-iosign-family-name": "Rossi"
      },
      body: { document_url: "https://blob.test.it/to-fill.pdf" }
    };
    const run = CreateFilledDocumentHandler({ ...dependencies(), input: req });
    await expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 201,
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Location: `https://blob.test.it/filled/${signer.id}.pdf`
          })
        })
      })
    );
  });
});
