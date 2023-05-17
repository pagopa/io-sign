import { describe, expect, it, beforeAll } from "vitest";

import * as L from "@pagopa/logger";
import * as H from "@pagopa/handler-kit";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { Issuer } from "@io-sign/io-sign/issuer";
import { newId } from "@io-sign/io-sign/id";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { IssuerRepository } from "../../../../issuer";
import { SetSignatureRequestStatusHandler } from "../set-signature-request-status";
import {
  SignatureRequest,
  SignatureRequestRepository,
} from "../../../../signature-request";
import { EventHubProducerClient } from "@azure/event-hubs";
import { QueueClient } from "@azure/storage-queue";

describe("SetSignatureRequestHandler", () => {
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
  };

  const signatureRequests: ReadonlyArray<SignatureRequest> = [
    {
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
    },
    {
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
      status: "WAIT_FOR_SIGNATURE",
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(),
      documents: [],
      qrCodeUrl: "qrCodeUrl",
    },
  ];

  const mocks = { issuer, signatureRequests };

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
      findByDossier: () => Promise.reject("not implemented"),
      insert: () => TE.left(new Error("not implemented")),
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
        signatureRequestId: mocks.signatureRequests[0].id,
      },
      body: "READY",
    };
    const run = SetSignatureRequestStatusHandler({
      logger,
      issuerRepository,
      signatureRequestRepository,
      input: req,
      inputDecoder: H.HttpRequest,
      eventAnalyticsClient: {} as EventHubProducerClient,
      readyQueueClient: {} as QueueClient,
      canceledQueueClient: {} as QueueClient,
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
    const req = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-subscription-id": mocks.issuer.subscriptionId,
      },
      path: {
        signatureRequestId: newId(),
      },
      body: "READY",
    };
    const run = SetSignatureRequestStatusHandler({
      logger,
      issuerRepository,
      signatureRequestRepository,
      input: req,
      inputDecoder: H.HttpRequest,
      eventAnalyticsClient: {} as EventHubProducerClient,
      readyQueueClient: {} as QueueClient,
      canceledQueueClient: {} as QueueClient,
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

  it("should return a 422 HTTP response on invalid body", () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-subscription-id": mocks.issuer.subscriptionId,
      },
      path: {
        signatureRequestId: mocks.signatureRequests[0].id,
      },
      body: "foo",
    };
    const run = SetSignatureRequestStatusHandler({
      logger,
      issuerRepository,
      signatureRequestRepository,
      input: req,
      inputDecoder: H.HttpRequest,
      eventAnalyticsClient: {} as EventHubProducerClient,
      readyQueueClient: {} as QueueClient,
      canceledQueueClient: {} as QueueClient,
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

  it("should return a 204 HTTP response on success when settings status to READY", () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-subscription-id": mocks.issuer.subscriptionId,
      },
      path: {
        signatureRequestId: mocks.signatureRequests.find(
          (signatureRequest) => signatureRequest.status === "DRAFT"
        )?.id!,
      },
      body: "READY",
    };

    const run = SetSignatureRequestStatusHandler({
      logger,
      issuerRepository,
      signatureRequestRepository,
      input: req,
      inputDecoder: H.HttpRequest,
      eventAnalyticsClient: {} as EventHubProducerClient,
      readyQueueClient: {
        sendMessage: (_: string) => Promise.resolve({}),
      } as QueueClient,
      canceledQueueClient: {} as QueueClient,
    });
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 204,
        }),
      })
    );
  });

  it("should return a 204 HTTP response on success when settings status to CANCELED", () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-subscription-id": mocks.issuer.subscriptionId,
      },
      path: {
        signatureRequestId: mocks.signatureRequests.find(
          (signatureRequest) => signatureRequest.status === "WAIT_FOR_SIGNATURE"
        )?.id!,
      },
      body: "CANCELED",
    };
    const run = SetSignatureRequestStatusHandler({
      logger,
      issuerRepository,
      signatureRequestRepository,
      input: req,
      inputDecoder: H.HttpRequest,
      eventAnalyticsClient: {} as EventHubProducerClient,
      readyQueueClient: {} as QueueClient,
      canceledQueueClient: {
        sendMessage: (_: string) => Promise.resolve({}),
      } as QueueClient,
    });
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 204,
        }),
      })
    );
  });
});
