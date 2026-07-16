import { describe, expect, it, beforeAll } from "vitest";

import * as L from "@pagopa/logger";
import * as H from "@pagopa/handler-kit";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/TaskEither";
import { newId } from "@io-sign/io-sign/id";
import {
  EmailString,
  FiscalCode,
  NonEmptyString,
} from "@pagopa/ts-commons/lib/strings";
import { SignerRepository } from "@io-sign/io-sign/signer";
import {
  SignatureRequest,
  SignatureRequestRepository,
} from "../../../../signature-request";

import { GetSignatureRequestHandler } from "../get-signature-request";
import { BaseContainerClientWithFallback } from "@pagopa/azure-storage-migration-kit";

describe("GetSignatureRequestHandler", () => {
  let signatureRequestRepository: SignatureRequestRepository;
  let signerRepository: SignerRepository;

  const signer = { id: newId() };
  const fiscalCode = "RSSMRA85T10A562S" as FiscalCode;

  const signatureRequest: SignatureRequest = {
    id: newId(),
    status: "WAIT_FOR_SIGNATURE",
    documents: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(),
    issuerId: newId(),
    dossierId: newId(),
    signerId: signer.id,
    dossierTitle: "Richiesta di firma" as NonEmptyString,
    issuerEnvironment: "TEST",
    issuerDepartment: "",
    issuerInternalInstitutionId: newId(),
    issuerDescription: "Università degli Studi di Vitest" as NonEmptyString,
    issuerEmail: "issuer+mail@unit.io.pagopa.it" as EmailString,
    qrCodeUrl: "https://static.pagopa.it/qrcode.png",
  };

  const mocks = { signer, signatureRequest };

  const logger: L.Logger = {
    log: () => () => {},
    format: L.format.simple,
  };

  beforeAll(() => {
    signatureRequestRepository = {
      findBySignerId: () => TE.left(new Error("not implemented")),
      get: (id, signerId) =>
        mocks.signatureRequest.id === id &&
        mocks.signatureRequest.signerId === signerId
          ? TE.right(O.some(signatureRequest))
          : TE.right(O.none),
      upsert: () => TE.left(new Error("not implemented")),
    };
    signerRepository = {
      getSignerByFiscalCode: (fc) =>
        fc === fiscalCode
          ? TE.right(signer)
          : TE.left(new Error("unknown fiscal code")),
      getFiscalCodeBySignerId: () => TE.left(new Error("not implemented")),
    };
  });

  it("should return a 400 HTTP response when x-iosign-fiscal-code header is not present", () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      path: {
        signatureRequestId: mocks.signatureRequest.id,
      },
      headers: {
        foo: "foo",
      },
    };
    const run = GetSignatureRequestHandler({
      signatureRequestRepository,
      signerRepository,
      logger,
      inputDecoder: H.HttpRequest,
      input: req,
      validatedContainerClient: {} as BaseContainerClientWithFallback,
      signedContainerClient: {} as BaseContainerClientWithFallback,
    });
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

  it("should return a 404 HTTP response when signature request is not found", () => {
    const req = {
      ...H.request("https://api.test.it/"),
      path: {
        signatureRequestId: newId(),
      },
      headers: {
        "x-iosign-fiscal-code": fiscalCode,
      },
    };
    const run = GetSignatureRequestHandler({
      signatureRequestRepository,
      signerRepository,
      logger,
      inputDecoder: H.HttpRequest,
      input: req,
      validatedContainerClient: {} as BaseContainerClientWithFallback,
      signedContainerClient: {} as BaseContainerClientWithFallback,
    });
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 404,
          headers: expect.objectContaining({
            "Content-Type": "application/problem+json",
          }),
        }),
      })
    );
  });

  it("should return a 200 HTTP response when signature request is found", () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      path: {
        signatureRequestId: mocks.signatureRequest.id,
      },
      headers: {
        "x-iosign-fiscal-code": fiscalCode,
      },
    };
    const run = GetSignatureRequestHandler({
      signatureRequestRepository,
      signerRepository,
      logger,
      inputDecoder: H.HttpRequest,
      input: req,
      validatedContainerClient: {} as BaseContainerClientWithFallback,
      signedContainerClient: {} as BaseContainerClientWithFallback,
    });
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 200,
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "x-io-sign-environment": "test",
          }),
        }),
      })
    );
  });
});
