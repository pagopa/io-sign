import { describe, expect, it, beforeAll } from "vitest";

import * as L from "@pagopa/logger";
import * as H from "@pagopa/handler-kit";
import * as E from "fp-ts/lib/Either";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { Issuer } from "@io-sign/io-sign/issuer";
import { newId } from "@io-sign/io-sign/id";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { CreateSignatureRequestHandler } from "../create-signature-request";
import { Dossier, DossierRepository } from "../../../../dossier";
import { DocumentMetadata } from "@io-sign/io-sign/document";
import { IssuerRepository } from "../../../../issuer";
import {
  SignatureRequest,
  SignatureRequestRepository,
} from "../../../../signature-request";
import { EventHubProducerClient } from "@azure/event-hubs";
import { pipe } from "fp-ts/lib/function";

describe("CreateSignatureRequestHandler", () => {
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
  };

  const dossier: Dossier = {
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
  };

  const signatureRequest: SignatureRequest = {
    id: newId(),
    issuerId: issuer.id,
    issuerEmail: dossier.supportEmail,
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

  const mocks = { issuer, dossier, signatureRequest };

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
      getById: (id, issuerId) =>
        mocks.dossier.id === id && mocks.dossier.issuerId === issuerId
          ? TE.right(O.some(dossier))
          : TE.right(O.none),
    };

    signatureRequestRepository = {
      get: () => TE.left(new Error("not implemented")),
      upsert: () => TE.left(new Error("not implemented")),
      findByDossier: () => Promise.reject("not implemented"),
      insert: (request) => TE.right(request),
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
    };
    const run = CreateSignatureRequestHandler({
      logger,
      issuerRepository,
      dossierRepository,
      signatureRequestRepository,
      input: req,
      inputDecoder: H.HttpRequest,
      eventAnalyticsClient: {} as EventHubProducerClient,
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

  it("should return a 422 HTTP response on invalid body", () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-subscription-id": mocks.issuer.subscriptionId,
      },
      body: {},
    };
    const run = CreateSignatureRequestHandler({
      logger,
      issuerRepository,
      dossierRepository,
      signatureRequestRepository,
      input: req,
      inputDecoder: H.HttpRequest,
      eventAnalyticsClient: {} as EventHubProducerClient,
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

  it("should return a 201 HTTP response on success", () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-subscription-id": mocks.issuer.subscriptionId,
      },
      body: {
        dossier_id: mocks.dossier.id,
        signer_id: newId(),
      },
    };
    const run = CreateSignatureRequestHandler({
      logger,
      issuerRepository,
      dossierRepository,
      signatureRequestRepository,
      input: req,
      inputDecoder: H.HttpRequest,
      eventAnalyticsClient: {} as EventHubProducerClient,
    });
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 201,
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      })
    );
  });

  it("should return a 500 HTTP response on error on insert", () => {
    const signatureRequestRepositoryThatFailsOnInsert: SignatureRequestRepository =
      {
        get: () => TE.left(new Error("not implemented")),
        upsert: () => TE.left(new Error("not implemented")),
        findByDossier: () => Promise.reject("not implemented"),
        insert: () => TE.left(new Error("insert failed")),
        patchDocument: (request, documentId) =>
          TE.left(new Error("not implemented")),
      };
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-subscription-id": mocks.issuer.subscriptionId,
      },
      body: {
        dossier_id: mocks.dossier.id,
        signer_id: newId(),
      },
    };
    const run = CreateSignatureRequestHandler({
      logger,
      issuerRepository,
      dossierRepository,
      signatureRequestRepository: signatureRequestRepositoryThatFailsOnInsert,
      input: req,
      inputDecoder: H.HttpRequest,
      eventAnalyticsClient: {} as EventHubProducerClient,
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

  it("should return an HTTP response with signature request documents_metadata in the body", async () => {
    const documents_metadata = [
      {
        title: "test doc #1",
        signature_fields: [],
      },
      {
        title: "test doc #2",
        signature_fields: [],
      },
    ];
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-subscription-id": mocks.issuer.subscriptionId,
      },
      body: {
        dossier_id: mocks.dossier.id,
        signer_id: newId(),
        documents_metadata,
      },
    };
    const run = CreateSignatureRequestHandler({
      logger,
      issuerRepository,
      dossierRepository,
      signatureRequestRepository,
      input: req,
      inputDecoder: H.HttpRequest,
      eventAnalyticsClient: {} as EventHubProducerClient,
    });

    const metadata = pipe(
      await run(),
      E.fold(
        () => [],
        (result) =>
          result.statusCode === 201
            ? result.body.documents.map((document) => document.metadata)
            : []
      )
    );

    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 201,
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      })
    );
    expect(metadata).toStrictEqual(documents_metadata);
  });
});
