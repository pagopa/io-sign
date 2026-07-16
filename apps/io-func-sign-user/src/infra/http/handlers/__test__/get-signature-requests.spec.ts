import { describe, expect, it, beforeAll } from "vitest";

import * as L from "@pagopa/logger";
import * as H from "@pagopa/handler-kit";

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

import { GetSignatureRequestsHandler } from "../get-signature-requests";
import { SignatureRequestToListView } from "../../encoders/signature-request";

describe("GetSignatureRequestsHandler", () => {
  let signatureRequestRepository: SignatureRequestRepository;
  let signerRepository: SignerRepository;

  const signer = { id: newId() };
  const signerWithNoRequests = { id: newId() };
  const fiscalCode = "RSSMRA85T10A562S" as FiscalCode;
  const fiscalCodeWithNoRequests = "MRTMTT91D08F205J" as FiscalCode;

  const requests: ReadonlyArray<SignatureRequest> = [
    {
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
    },
  ];

  const mocks = { signer, requests };

  const logger: L.Logger = {
    log: () => () => {},
    format: L.format.simple,
  };

  beforeAll(() => {
    signatureRequestRepository = {
      findBySignerId: (signerId) =>
        signerId === mocks.signer.id ? TE.right(mocks.requests) : TE.right([]),
      get: () => TE.left(new Error("not implemented")),
      upsert: () => TE.left(new Error("not implemented")),
    };
    signerRepository = {
      getSignerByFiscalCode: (fc) => {
        if (fc === fiscalCode) return TE.right(signer);
        if (fc === fiscalCodeWithNoRequests) return TE.right(signerWithNoRequests);
        return TE.left(new Error("unknown fiscal code"));
      },
      getFiscalCodeBySignerId: () => TE.left(new Error("not implemented")),
    };
  });

  it("should return a 200 HTTP response on success with items in list view", () => {
    const req = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-iosign-fiscal-code": fiscalCode,
      },
    };
    const run = GetSignatureRequestsHandler({
      signatureRequestRepository,
      signerRepository,
      logger,
      inputDecoder: H.HttpRequest,
      input: req,
    });
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 200,
          body: {
            items: mocks.requests.map(SignatureRequestToListView.encode),
          },
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      })
    );
  });
  it("should return a 200 HTTP response with empty array when there are no signature requests for the signer", () => {
    const req = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-iosign-fiscal-code": fiscalCodeWithNoRequests,
      },
    };
    const run = GetSignatureRequestsHandler({
      signatureRequestRepository,
      signerRepository,
      logger,
      inputDecoder: H.HttpRequest,
      input: req,
    });
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 200,
          body: { items: [] },
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      })
    );
  });
  it("should return a 500 HTTP response when signerRepository fails", () => {
    const req = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-iosign-fiscal-code": "VRDLGI69P10G111X" as FiscalCode,
      },
    };
    const run = GetSignatureRequestsHandler({
      signatureRequestRepository,
      signerRepository,
      logger,
      inputDecoder: H.HttpRequest,
      input: req,
    });
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 500,
          headers: expect.objectContaining({
            "Content-Type": "application/problem+json",
          }),
        }),
      })
    );
  });
  it("should return a 400 HTTP response when x-iosign-fiscal-code header is not present", () => {
    const req = H.request("https://api.test.it/");
    const run = GetSignatureRequestsHandler({
      signatureRequestRepository,
      signerRepository,
      logger,
      inputDecoder: H.HttpRequest,
      input: req,
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
  it("should return a 422 HTTP response when x-iosign-fiscal-code is not a valid fiscal code", () => {
    const req = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-iosign-fiscal-code": "not-a-fiscal-code",
      },
    };
    const run = GetSignatureRequestsHandler({
      signatureRequestRepository,
      signerRepository,
      logger,
      inputDecoder: H.HttpRequest,
      input: req,
    });
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 422,
          headers: expect.objectContaining({
            "Content-Type": "application/problem+json",
          }),
        }),
      })
    );
  });
});
