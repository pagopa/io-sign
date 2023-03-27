import { describe, expect, it, beforeAll } from "@jest/globals";

import * as L from "@pagopa/logger";
import * as H from "@pagopa/handler-kit";

import * as TE from "fp-ts/TaskEither";
import { newId } from "@io-sign/io-sign/id";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import {
  SignatureRequest,
  SignatureRequestRepository,
} from "../../../../signature-request";

import { GetSignatureRequestsHandler } from "../get-signature-requests";
import { SignatureRequestToListView } from "../../encoders/signature-request";

describe("GetSignatureRequestsHandler", () => {
  let signatureRequestRepository: SignatureRequestRepository;

  const signer = { id: newId() };

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
    };
  });

  it("should return a 200 HTTP response on success with items in list view", () => {
    const req = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-iosign-signer-id": mocks.signer.id,
      },
    };
    const run = GetSignatureRequestsHandler({
      signatureRequestRepository,
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
  it("should return a 200 HTTP response with empty array when there are not signature requests", () => {
    const req = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-iosign-signer-id": newId(),
      },
    };
    const run = GetSignatureRequestsHandler({
      signatureRequestRepository,
      logger,
      inputDecoder: H.HttpRequest,
      input: req,
    });
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 200,
          body: {
            items: [],
          },
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      })
    );
  });
  it("should return a 400 HTTP response without signer header", () => {
    const req = H.request("https://api.test.it/");
    const run = GetSignatureRequestsHandler({
      signatureRequestRepository,
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
  it("should return a 422 HTTP response on invalid signer", () => {
    const req = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-iosign-signer-id": "",
      },
    };
    const run = GetSignatureRequestsHandler({
      signatureRequestRepository,
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
