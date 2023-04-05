import { describe, it, expect, beforeAll } from "vitest";

import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";
import { newId } from "@io-sign/io-sign/id";
import { newSigner } from "@io-sign/io-sign/signer";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { EmailString } from "@pagopa/ts-commons/lib/strings";

import * as L from "@pagopa/logger";
import * as H from "@pagopa/handler-kit";
import { pipe } from "fp-ts/lib/function";
import { Issuer, IssuerRepository } from "../../../../issuer";
import { GetSignatureRequestHandler } from "../get-signature-request";
import { SignerRepository } from "../../../../signer";
import {
  SignatureRequestRepository,
  SignatureRequest,
} from "../../../../signature-request";

describe("GetSignatureRequestHandler", () => {
  let signerRepository: SignerRepository;
  let issuerRepository: IssuerRepository;
  let signatureRequestRepository: SignatureRequestRepository;

  const logger: L.Logger = {
    log: () => () => {},
    format: L.format.simple,
  };

  const signer = newSigner();

  const institution = { vatNumber: "15376371009" };

  const issuer: Issuer = {
    id: newId(),
    vatNumber: "15376371009" as NonEmptyString,
  };

  const user = { fiscalCode: "CVLYCU95L20C351Z" };

  const signatureRequest: SignatureRequest = {
    id: newId(),
    status: "DRAFT",
    documents: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(),
    issuerId: issuer.id,
    dossierId: newId(),
    signerId: signer.id,
    dossierTitle: "Richiesta di firma" as NonEmptyString,
    issuerEnvironment: "TEST",
    issuerInternalInstitutionId: newId(),
    issuerDescription: "Università degli Studi di Vitest" as NonEmptyString,
    issuerEmail: "issuer+mail@unit.io.pagopa.it" as EmailString,
    issuerIsInternal: false,
    issuerDepartment: "",
  };

  const mocks = { signer, institution, issuer, user, signatureRequest };

  beforeAll(() => {
    signerRepository = {
      getByFiscalCode: (fiscalCode) =>
        fiscalCode === mocks.user.fiscalCode
          ? TE.right(O.some(mocks.signer))
          : TE.right(O.none),
    };

    signatureRequestRepository = {
      getByIssuerId: (id, issuerId) =>
        id === mocks.signatureRequest.id &&
        issuerId === mocks.signatureRequest.issuerId
          ? TE.right(O.some(mocks.signatureRequest))
          : TE.right(O.none),
      getBySignerId: (id, signerId) =>
        id === mocks.signatureRequest.id &&
        signerId === mocks.signatureRequest.signerId
          ? TE.right(O.some(mocks.signatureRequest))
          : TE.right(O.none),
    };

    issuerRepository = {
      getByVatNumber: (vatNumber) =>
        vatNumber === mocks.institution.vatNumber
          ? TE.right(O.some(mocks.issuer))
          : TE.right(O.none),
    };
  });

  it("should return a 200 HTTP response when the signature request is found", () => {
    const run = GetSignatureRequestHandler({
      input: pipe(H.request("https://my-req-url.it"), (req) => ({
        ...req,
        method: "POST",
        body: {
          vat_number: mocks.institution.vatNumber,
        },
        path: {
          id: mocks.signatureRequest.id,
        },
      })),
      inputDecoder: H.HttpRequest,
      logger,
      issuerRepository,
      signerRepository,
      signatureRequestRepository,
    });
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 200,
        }),
      })
    );
  });

  it("should return a 404 HTTP response when the signature request was not found", () => {
    const requestForSignatureRequestId = (id: string) =>
      GetSignatureRequestHandler({
        input: pipe(H.request("https://my-req-url.it"), (req) => ({
          ...req,
          method: "POST",
          body: {
            fiscal_code: mocks.user.fiscalCode,
          },
          path: {
            id,
          },
        })),
        inputDecoder: H.HttpRequest,
        logger,
        signerRepository,
        signatureRequestRepository,
        issuerRepository,
      })();
    expect(
      requestForSignatureRequestId(mocks.signatureRequest.id)
    ).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 200,
        }),
      })
    );
    expect(requestForSignatureRequestId(newId())).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 404,
        }),
      })
    );
  });

  it("should return a 404 HTTP response when the signer was not found", () => {
    const requestWithRawFiscalCode = (fiscalCode: string) =>
      GetSignatureRequestHandler({
        input: pipe(H.request("https://my-req-url.it"), (req) => ({
          ...req,
          method: "POST",
          body: {
            fiscal_code: fiscalCode,
          },
          path: {
            id: mocks.signatureRequest.id,
          },
        })),
        inputDecoder: H.HttpRequest,
        logger,
        signerRepository,
        signatureRequestRepository,
        issuerRepository,
      })();
    expect(requestWithRawFiscalCode("ZZPYCU68H20C259Q")).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 404,
        }),
      })
    );
    expect(requestWithRawFiscalCode(mocks.user.fiscalCode)).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 200,
        }),
      })
    );
  });

  it("should return the right 4xx responses when the request body or the path param are malformed", () => {
    const testTable: Array<{
      input: { body: unknown; path: Record<string, string> };
      statusCode: 400 | 422 | 404;
    }> = [
      {
        input: { body: {}, path: {} },
        statusCode: 422,
      },
      {
        input: { body: { vat_number: "11245371228" }, path: { id: newId() } },
        statusCode: 404,
      },
      {
        input: {
          body: { fiscal_code: "CVLYCU95L20C351Z" },
          path: { id: newId() },
        },
        statusCode: 404,
      },
      {
        input: {
          body: { fiscal_code: "CVLYCU95L20C351Z", vat_number: "11245371228" },
          path: { id: newId() },
        },
        statusCode: 404,
      },
      {
        input: {
          body: { fiscal_code: "my@email.address" },
          path: { id: newId() },
        },
        statusCode: 422,
      },
      {
        input: {
          body: { fiscal_code: "CVLYCU95L20C351Z" },
          path: {},
        },
        statusCode: 400,
      },
    ];
    testTable.forEach(({ input, statusCode }) => {
      const run = GetSignatureRequestHandler({
        input: pipe(H.request("https://req-url.it"), (req) => ({
          ...req,
          ...input,
          method: "POST",
        })),
        logger,
        inputDecoder: H.HttpRequest,
        signatureRequestRepository,
        signerRepository,
        issuerRepository,
      });
      expect(run()).resolves.toEqual(
        expect.objectContaining({
          right: expect.objectContaining({
            statusCode,
          }),
        })
      );
    });
  });
});
