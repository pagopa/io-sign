import { describe, expect, it, beforeAll } from "@jest/globals";

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
import { GetDossierHandler } from "../get-dossier";

describe("GetDossierHandler", () => {
  let issuerRepository: IssuerRepository;
  let dossierRepository: DossierRepository;

  const issuer: Issuer = {
    id: newId(),
    subscriptionId: newId(),
    email: "issuer.test@mail.pagopa.it" as EmailString,
    description: "issuer used in unit tests" as NonEmptyString,
    internalInstitutionId: newId(),
    environment: "TEST",
    vatNumber: "14711371128" as NonEmptyString,
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
  };

  const mocks = { issuer, dossier };

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
        dossierId: mocks.dossier.id,
      },
    };
    const run = GetDossierHandler({
      logger,
      issuerRepository,
      dossierRepository,
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

  it("should return a 404 HTTP response on not found", () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      path: {
        dossierId: newId(),
      },
      headers: {
        "x-subscription-id": mocks.issuer.subscriptionId,
      },
    };
    const run = GetDossierHandler({
      logger,
      issuerRepository,
      dossierRepository,
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

  it("should reutrn a 200 HTTP response when dossier is found", () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      path: {
        dossierId: mocks.dossier.id,
      },
      headers: {
        "x-subscription-id": mocks.issuer.subscriptionId,
      },
    };
    const run = GetDossierHandler({
      logger,
      issuerRepository,
      dossierRepository,
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
