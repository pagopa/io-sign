import { describe, expect, it, beforeAll } from "vitest";

import * as L from "@pagopa/logger";
import * as H from "@pagopa/handler-kit";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { Issuer } from "@io-sign/io-sign/issuer";
import { newId } from "@io-sign/io-sign/id";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { IssuerRepository } from "../../../../issuer";
import { SetSignatureRequestExpiresAtHandler } from "../set-signature-request-expires-at";
import {
  SignatureRequest,
  SignatureRequestRepository,
} from "../../../../signature-request";

describe("SetSignatureRequestExpiresAtHandler", () => {
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
    status: "ACTIVE",
  };

  const inOneYear = new Date(
    Date.now() + 365 * 24 * 60 * 60 * 1000
  ).toISOString();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const baseRequest = {
    issuerId: issuer.id,
    issuerEmail: issuer.email,
    issuerDescription: issuer.description,
    issuerInternalInstitutionId: issuer.internalInstitutionId,
    issuerEnvironment: issuer.environment,
    issuerDepartment: issuer.department,
    signerId: newId(),
    dossierId: newId(),
    dossierTitle: "Richiesta di firma" as NonEmptyString,
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    documents: [],
  };

  const signatureRequests: ReadonlyArray<SignatureRequest> = [
    {
      ...baseRequest,
      id: newId(),
      status: "DRAFT",
    },
    {
      ...baseRequest,
      id: newId(),
      status: "WAIT_FOR_SIGNATURE",
      qrCodeUrl: "qrCodeUrl",
    },
  ];

  const mocks = { issuer, signatureRequests };

  const draftId = mocks.signatureRequests.find((r) => r.status === "DRAFT")!.id;
  const nonDraftId = mocks.signatureRequests.find(
    (r) => r.status !== "DRAFT"
  )!.id;

  beforeAll(() => {
    issuerRepository = {
      getBySubscriptionId: (subscriptionId) =>
        mocks.issuer.subscriptionId === subscriptionId
          ? TE.right(O.some(mocks.issuer))
          : TE.right(O.none),
      getByVatNumber: () => TE.right(O.none),
    };

    signatureRequestRepository = {
      get: (id, issuerId) => {
        const signatureRequest = mocks.signatureRequests.find(
          (signatureRequest) =>
            signatureRequest.id === id && signatureRequest.issuerId === issuerId
        );
        return signatureRequest
          ? TE.right(O.some(signatureRequest))
          : TE.right(O.none);
      },
      upsert: TE.right,
      patchExpiresAt: (id, _issuerId, expiresAt) => {
        const found = mocks.signatureRequests.find((r) => r.id === id);
        return found
          ? TE.right({ ...found, expiresAt })
          : TE.left(new Error("not found"));
      },
      findByDossier: () => Promise.reject("not implemented"),
      insert: () => TE.left(new Error("not implemented")),
      patchDocument: () => TE.left(new Error("not implemented")),
    };
  });

  const logger: L.Logger = {
    log: () => () => {},
    format: L.format.simple,
  };

  const run = (req: H.HttpRequest) =>
    SetSignatureRequestExpiresAtHandler({
      logger,
      issuerRepository,
      signatureRequestRepository,
      input: req,
      inputDecoder: H.HttpRequest,
    })();

  it("should return a 401 HTTP response when the issuer is not found", async () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: { "x-subscription-id": "sub-that-does-not-exists" },
      path: { signatureRequestId: draftId },
      body: { expires_at: inOneYear },
    };
    await expect(run(req)).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({ statusCode: 401 }),
      })
    );
  });

  it("should return a 404 HTTP response when the signature request is not found", async () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: { "x-subscription-id": mocks.issuer.subscriptionId },
      path: { signatureRequestId: newId() },
      body: { expires_at: inOneYear },
    };
    await expect(run(req)).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({ statusCode: 404 }),
      })
    );
  });

  it("should return a 422 HTTP response on invalid body", async () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: { "x-subscription-id": mocks.issuer.subscriptionId },
      path: { signatureRequestId: draftId },
      body: { expires_at: "not-a-date" },
    };
    await expect(run(req)).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({ statusCode: 422 }),
      })
    );
  });

  it("should return a 400 HTTP response when the signature request is not in DRAFT status", async () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: { "x-subscription-id": mocks.issuer.subscriptionId },
      path: { signatureRequestId: nonDraftId },
      body: { expires_at: inOneYear },
    };
    await expect(run(req)).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({ statusCode: 400 }),
      })
    );
  });

  it("should return a 400 HTTP response when the new expiry date is in the past", async () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: { "x-subscription-id": mocks.issuer.subscriptionId },
      path: { signatureRequestId: draftId },
      body: { expires_at: oneHourAgo },
    };
    await expect(run(req)).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({ statusCode: 400 }),
      })
    );
  });

  it("should return a 204 HTTP response on success", async () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: { "x-subscription-id": mocks.issuer.subscriptionId },
      path: { signatureRequestId: draftId },
      body: { expires_at: inOneYear },
    };
    await expect(run(req)).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({ statusCode: 204 }),
      })
    );
  });
});
