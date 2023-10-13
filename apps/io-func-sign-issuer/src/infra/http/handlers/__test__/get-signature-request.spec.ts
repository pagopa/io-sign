import { describe, expect, it, beforeAll } from "vitest";

import * as L from "@pagopa/logger";
import * as H from "@pagopa/handler-kit";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { Issuer } from "@io-sign/io-sign/issuer";
import { newId } from "@io-sign/io-sign/id";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { IssuerRepository } from "../../../../issuer";
import { GetSignatureRequestHandler } from "../get-signature-request";
import {
  SignatureRequest,
  SignatureRequestRepository,
} from "../../../../signature-request";
import { ContainerClient } from "@azure/storage-blob";

describe("GetSignatureRequestHandler", () => {
  let issuerRepository: IssuerRepository;
  let signatureRequestRepository: SignatureRequestRepository;

  const issuer: Issuer = {
    id: newId(),
    subscriptionId: newId(),
    email: "issuer.test@mail.pagopa.it" as EmailString,
    description: "issuer used in unit tests" as NonEmptyString,
    internalInstitutionId: newId(),
    environment: "TEST",
    vatNumber: "14711371128" as NonEmptyString,
    department: "dep1" as NonEmptyString,
    state: "ACTIVE",
  };

  const signatureRequest: SignatureRequest = {
    id: newId(),
    issuerId: issuer.id,
    issuerEmail: issuer.email,
    issuerDescription: issuer.description,
    issuerInternalInstitutionId: issuer.internalInstitutionId,
    issuerEnvironment: issuer.environment,
    issuerDepartment: issuer.department,
    signerId: newId(),
    dossierId: newId(),
    dossierTitle: "Richiesta di firma" as NonEmptyString,
    status: "DRAFT",
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(),
    documents: [],
  };

  const mocks = { issuer, signatureRequest };

  beforeAll(() => {
    issuerRepository = {
      getBySubscriptionId: (subscriptionId) =>
        mocks.issuer.subscriptionId === subscriptionId
          ? TE.right(O.some(mocks.issuer))
          : TE.right(O.none),
      getByVatNumber: () => TE.right(O.none),
    };

    signatureRequestRepository = {
      get: (id, issuerId) =>
        mocks.signatureRequest.id === id &&
        mocks.signatureRequest.issuerId === issuerId
          ? TE.right(O.some(signatureRequest))
          : TE.right(O.none),
      upsert: () => TE.left(new Error("not implemented")),
      findByDossier: () => Promise.reject("not implemented"),
      insert: () => TE.left(new Error("not implemented")),
      patchDocument: (request, documentId) =>
        TE.left(new Error("not implemented")),
    };
  });

  const logger: L.Logger = {
    log: () => () => {},
    format: L.format.simple,
  };

  it("should return a 401 HTTP response when issuer is not found", () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      path: {
        signatureRequestId: mocks.signatureRequest.id,
      },
      headers: {
        "x-subscription-id": "sub-that-does-not-exists",
      },
    };
    const run = GetSignatureRequestHandler({
      logger,
      issuerRepository,
      signatureRequestRepository,
      signedContainerClient: {} as ContainerClient,
      input: req,
      inputDecoder: H.HttpRequest,
    });
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

  it("should return a 404 HTTP response when signature request is not found", () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      path: {
        signatureRequestId: newId(),
      },
      headers: {
        "x-subscription-id": mocks.issuer.subscriptionId,
      },
    };
    const run = GetSignatureRequestHandler({
      logger,
      issuerRepository,
      signatureRequestRepository,
      signedContainerClient: {} as ContainerClient,
      input: req,
      inputDecoder: H.HttpRequest,
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
        "x-subscription-id": mocks.issuer.subscriptionId,
      },
    };
    const run = GetSignatureRequestHandler({
      logger,
      issuerRepository,
      signatureRequestRepository,
      signedContainerClient: {} as ContainerClient,
      input: req,
      inputDecoder: H.HttpRequest,
    });
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 200,
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      })
    );
  });
});
