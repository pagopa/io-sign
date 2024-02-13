import { describe, expect, it, beforeAll } from "vitest";

import * as L from "@pagopa/logger";
import * as H from "@pagopa/handler-kit";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { Issuer } from "@io-sign/io-sign/issuer";
import { newId } from "@io-sign/io-sign/id";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { DossierRepository } from "../../../../dossier";
import { IssuerRepository } from "../../../../issuer";
import { CreateDossierHandler } from "../create-dossier";

describe("CreateDossierHandler", () => {
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
    department: "dep1" as NonEmptyString,
    status: "ACTIVE",
  };

  const mocks = { issuer };

  beforeAll(() => {
    issuerRepository = {
      getBySubscriptionId: (subscriptionId) =>
        mocks.issuer.subscriptionId === subscriptionId
          ? TE.right(O.some(mocks.issuer))
          : TE.right(O.none),
      getByVatNumber: () => TE.right(O.none),
    };

    dossierRepository = {
      insert: (dossier) => TE.right(dossier),
      getById: () => TE.right(O.none),
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
    const run = CreateDossierHandler({
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

  it("should return a 422 HTTP response on invalid body", () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-subscription-id": mocks.issuer.subscriptionId,
      },
      body: {},
    };
    const run = CreateDossierHandler({
      logger,
      issuerRepository,
      dossierRepository,
      input: req,
      inputDecoder: H.HttpRequest,
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
        title: "my test dossier",
        documents_metadata: [
          {
            title: "test doc #1",
            signature_fields: [],
          },
        ],
      },
    };
    const run = CreateDossierHandler({
      logger,
      issuerRepository,
      dossierRepository,
      input: req,
      inputDecoder: H.HttpRequest,
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
    const dossierRepositoryThatFailsOnInsert: DossierRepository = {
      insert: () => TE.left(new Error("insert failed")),
      getById: () => TE.right(O.none),
    };
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-subscription-id": mocks.issuer.subscriptionId,
      },
      body: {
        title: "my test dossier",
        documents_metadata: [
          {
            title: "test doc #1",
            signature_fields: [],
          },
        ],
      },
    };
    const run = CreateDossierHandler({
      logger,
      issuerRepository,
      dossierRepository: dossierRepositoryThatFailsOnInsert,
      input: req,
      inputDecoder: H.HttpRequest,
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

  it("should return an HTTP response with the dossier support email in the body", () => {
    const email = "test@test.test";
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-subscription-id": mocks.issuer.subscriptionId,
      },
      body: {
        title: "my test dossier",
        documents_metadata: [
          {
            title: "test doc #1",
            signature_fields: [],
          },
        ],
        support_email: email,
      },
    };
    const run = CreateDossierHandler({
      logger,
      issuerRepository,
      dossierRepository,
      input: req,
      inputDecoder: H.HttpRequest,
    });
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          body: expect.objectContaining({
            support_email: email,
          }),
        }),
      })
    );
  });

  it("should return an HTTP response with the issuer support email in the body", () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-subscription-id": mocks.issuer.subscriptionId,
      },
      body: {
        title: "my test dossier",
        documents_metadata: [
          {
            title: "test doc #1",
            signature_fields: [],
          },
        ],
      },
    };
    const run = CreateDossierHandler({
      logger,
      issuerRepository,
      dossierRepository,
      input: req,
      inputDecoder: H.HttpRequest,
    });
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          body: expect.objectContaining({
            support_email: issuer.email,
          }),
        }),
      })
    );
  });
});
