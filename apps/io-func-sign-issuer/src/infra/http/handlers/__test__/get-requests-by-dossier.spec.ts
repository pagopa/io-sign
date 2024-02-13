import { describe, expect, it, beforeAll } from "vitest";

import * as L from "@pagopa/logger";
import * as H from "@pagopa/handler-kit";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { Issuer } from "@io-sign/io-sign/issuer";
import { newId } from "@io-sign/io-sign/id";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { DocumentMetadata } from "@io-sign/io-sign/document";
import { Dossier, DossierRepository } from "../../../../dossier";
import { IssuerRepository } from "../../../../issuer";
import { GetRequestsByDossierHandler } from "../get-requests-by-dossier";
import {
  SignatureRequest,
  SignatureRequestRepository,
  newSignatureRequest,
} from "../../../../signature-request";
import { SignatureRequestToListApiModel } from "../../encoders/signature-request";

describe("GetRequestsByDossierHandler", () => {
  let issuerRepository: IssuerRepository;
  let dossierRepository: DossierRepository;
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
    status: "ACTIVE",
  };

  const makeDossier = (): Dossier => ({
    id: newId(),
    title: "my dossier" as NonEmptyString,
    issuerId: issuer.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    documentsMetadata: [
      {
        title: "doc #1" as NonEmptyString,
        signatureFields: [] as unknown as DocumentMetadata["signatureFields"],
        pdfDocumentMetadata: {
          pages: [],
          formFields: [],
        },
      },
    ],
    supportEmail: issuer.email,
  });

  const emptyDossier = makeDossier();
  const dossierWithRequests = makeDossier();

  const request: SignatureRequest = newSignatureRequest(
    dossierWithRequests,
    { id: newId() },
    issuer
  );

  const mocks = { issuer, emptyDossier, dossierWithRequests, request };

  beforeAll(() => {
    issuerRepository = {
      getBySubscriptionId: (subscriptionId) =>
        mocks.issuer.subscriptionId === subscriptionId
          ? TE.right(O.some(mocks.issuer))
          : TE.right(O.none),
      getByVatNumber: () => TE.right(O.none),
    };

    dossierRepository = {
      insert: () => TE.left(new Error("not implemented")),
      getById: (id) => {
        switch (id) {
          case mocks.dossierWithRequests.id:
            return TE.right(O.some(mocks.dossierWithRequests));
          case mocks.emptyDossier.id:
            return TE.right(O.some(mocks.emptyDossier));
          default:
            return TE.right(O.none);
        }
      },
    };

    signatureRequestRepository = {
      findByDossier: async (dossier) => ({
        items:
          mocks.dossierWithRequests.id === dossier.id ? [mocks.request] : [],
      }),
      get: () => TE.left(new Error("not implemented")),
      upsert: () => TE.left(new Error("not implemented")),
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
      headers: {
        "x-subscription-id": "sub-that-does-not-exists",
      },
      path: {
        dossierId: mocks.emptyDossier.id,
      },
    };
    const run = GetRequestsByDossierHandler({
      logger,
      issuerRepository,
      dossierRepository,
      signatureRequestRepository,
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

  it("should return a 404 HTTP response when dossier is not found", () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      path: {
        dossierId: newId(),
      },
      headers: {
        "x-subscription-id": mocks.issuer.subscriptionId,
      },
    };
    const run = GetRequestsByDossierHandler({
      logger,
      issuerRepository,
      dossierRepository,
      signatureRequestRepository,
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

  it("should return a well-formed 200 HTTP response when dossier is found", () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      path: {
        dossierId: mocks.dossierWithRequests.id,
      },
      headers: {
        "x-subscription-id": mocks.issuer.subscriptionId,
      },
    };
    const run = GetRequestsByDossierHandler({
      logger,
      issuerRepository,
      dossierRepository,
      signatureRequestRepository,
      input: req,
      inputDecoder: H.HttpRequest,
    });
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 200,
          body: SignatureRequestToListApiModel.encode({
            items: [mocks.request],
          }),
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      })
    );
  });

  it("should return an empty array when dossier is found but there are no requests", () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      path: {
        dossierId: mocks.emptyDossier.id,
      },
      headers: {
        "x-subscription-id": mocks.issuer.subscriptionId,
      },
    };

    const run = GetRequestsByDossierHandler({
      logger,
      issuerRepository,
      dossierRepository,
      signatureRequestRepository,
      input: req,
      inputDecoder: H.HttpRequest,
    });
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 200,
          body: expect.objectContaining({
            items: [],
          }),
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      })
    );
  });
});
