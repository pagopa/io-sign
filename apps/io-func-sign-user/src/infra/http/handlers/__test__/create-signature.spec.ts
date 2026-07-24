import { vi, describe, it, expect, beforeEach } from "vitest";

import * as H from "@pagopa/handler-kit";
import * as TE from "fp-ts/lib/TaskEither";
import * as L from "@pagopa/logger";

import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Database as CosmosDatabase } from "@azure/cosmos";
import { QueueClient } from "@azure/storage-queue";
import { ContainerClient } from "@azure/storage-blob";
import { BaseContainerClientWithFallback } from "@pagopa/azure-storage-migration-kit";

import { newId } from "@io-sign/io-sign/id";
import { SignerRepository } from "@io-sign/io-sign/signer";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import type { IoProfileClientWithApiKey } from "@io-sign/io-sign/infra/io-profile/client";

import { AssertionTypeEnum } from "../../../lollipop/models/AssertionType";
import type { LollipopApiClientExt } from "../../../lollipop/client";
import type { LollipopApiClientInt, LcParams } from "../../../lollipop/lc-params";

// ---------------------------------------------------------------------------
// Mock all modules that trigger module-level `agent.getHttpFetch(process.env)`
// (which calls require('node-fetch') – ESM-only in v3 – and fails in vitest's
// CommonJS environment) and modules that need controlled responses in tests.
// ---------------------------------------------------------------------------
vi.mock("../../../lollipop/lc-params", () => ({
  makeGetLcParams: vi.fn()
}));
vi.mock("../../../lollipop/assertion", () => ({
  makeGetBase64SamlAssertion: vi.fn()
}));
// namirial/client.ts → fetch-timeout.ts → agent.getHttpFetch
vi.mock("../../../namirial/client", () => ({
  makeGetToken: vi.fn()
}));
// namirial/signature-request.ts → fetch-timeout.ts + ./client → agent.getHttpFetch
vi.mock("../../../namirial/signature-request", () => ({
  makeCreateSignatureRequestWithToken: vi.fn()
}));
// io-profile/profile.ts → io-profile/client.ts → agent.getHttpFetch
vi.mock("@io-sign/io-sign/infra/io-profile/profile", () => ({
  makeGetValidatedEmailByFiscalCode: vi.fn()
}));

import { CreateSignatureHandler } from "../create-signature";
import { makeGetLcParams } from "../../../lollipop/lc-params";
import { makeGetBase64SamlAssertion } from "../../../lollipop/assertion";
import { makeGetToken } from "../../../namirial/client";
import { makeCreateSignatureRequestWithToken } from "../../../namirial/signature-request";
import { makeGetValidatedEmailByFiscalCode } from "@io-sign/io-sign/infra/io-profile/profile";

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const aFiscalCode = "RSSMRA85T10A562S" as FiscalCode;
const anAssertionRef = "sha256-n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg" as NonEmptyString;
const aSigner = { id: newId() };

const aLcParams: LcParams = {
  assertion_ref: anAssertionRef as unknown as LcParams["assertion_ref"],
  assertion_type: AssertionTypeEnum.SAML,
  lc_authentication_bearer: "a-bearer-jwt" as NonEmptyString,
  pub_key: "a-pub-key" as NonEmptyString
};

/**
 * A valid signature-input string with the nonce required by generateLCParams.
 * The pattern must match LollipopSignatureInput:
 * ^(?:sig\d+=[^,]*)(?:,\s*(?:sig\d+=[^,]*))*$
 */
const aValidSignatureInput =
  `sig1=("@method" "x-pagopa-lollipop-original-url");created=1618884475;nonce="test-nonce-123";keyid="${anAssertionRef}"`;

/** A valid signature value matching: ^((sig[0-9]+)=:[A-Za-z0-9+/=]*:(, ?)?)+$ */
const aValidSignature = "sig1=:aGVsbG8=:";

const aValidLollipopHeaders = {
  "signature-input": aValidSignatureInput,
  signature: aValidSignature,
  "x-pagopa-lollipop-assertion-ref": anAssertionRef,
  "x-pagopa-lollipop-assertion-type": AssertionTypeEnum.SAML,
  "x-pagopa-lollipop-public-key": "a-public-key",
  "x-pagopa-lollipop-custom-tos-challenge": "tos-challenge-value",
  "x-pagopa-lollipop-custom-sign-challenge": "sign-challenge-value"
};

const aValidBody = {
  signature_request_id: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  email: "mario.rossi@test.com",
  documents_to_sign: [],
  qtsp_clauses: {
    accepted_clauses: [{ text: "I accept the terms and conditions" }],
    filled_document_url: "https://example.com/document.pdf",
    nonce: "qtsp-nonce"
  }
};

const aValidRequest = (): H.HttpRequest => ({
  ...H.request("https://api.test.it/signatures"),
  method: "POST",
  headers: {
    "x-iosign-fiscal-code": aFiscalCode,
    "x-iosign-spid-level": "https://www.spid.gov.it/SpidL3",
    ...aValidLollipopHeaders
  },
  body: aValidBody
});

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

const logger: L.Logger = {
  log: () => () => {},
  format: L.format.simple
};

const buildDependencies = (overrides: Partial<{
  signerRepository: SignerRepository;
}> = {}) => ({
  logger,
  input: undefined as unknown,
  inputDecoder: H.HttpRequest,
  lollipopApiClientExt: {} as LollipopApiClientExt,
  lollipopApiClientInt: {} as LollipopApiClientInt,
  ioProfileClient: {
    client: {
      getProfile: () =>
        Promise.resolve({
          status: 200,
          value: {
            is_email_validated: true,
            email: "mario.rossi@test.com"
          }
        })
    }
  } as unknown as IoProfileClientWithApiKey,
  signerRepository: {
    getSignerByFiscalCode: (fc: FiscalCode) =>
      fc === aFiscalCode
        ? TE.right(aSigner)
        : TE.left(new EntityNotFoundError("Signer not found")),
    getFiscalCodeBySignerId: () => TE.left(new Error("not implemented"))
  } as SignerRepository,
  db: {} as CosmosDatabase,
  qtspQueue: {} as QueueClient,
  validatedContainerClient: {} as BaseContainerClientWithFallback,
  signedContainerClient: {} as ContainerClient,
  qtspConfig: {} as never,
  ...overrides
});

// ---------------------------------------------------------------------------
// Configure mocks before each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.mocked(makeGetLcParams).mockReturnValue(
    vi.fn().mockReturnValue(TE.right(aLcParams))
  );
  vi.mocked(makeGetBase64SamlAssertion).mockReturnValue(
    vi.fn().mockReturnValue(TE.right("base64-encoded-saml-assertion" as NonEmptyString))
  );
  vi.mocked(makeGetValidatedEmailByFiscalCode).mockReturnValue(
    vi.fn().mockReturnValue(TE.right("mario.rossi@test.com" as NonEmptyString))
  );
  // makeGetToken() → getToken fn → makeCreateSignatureRequestWithToken()(getToken)(config)
  vi.mocked(makeGetToken).mockReturnValue(vi.fn());
  vi.mocked(makeCreateSignatureRequestWithToken).mockReturnValue(
    vi.fn().mockReturnValue(vi.fn())
  );
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CreateSignatureHandler", () => {
  describe("input validation — 400 responses", () => {
    it("should return 400 when x-iosign-fiscal-code header is missing", async () => {
      const req: H.HttpRequest = {
        ...aValidRequest(),
        headers: {
          "x-iosign-spid-level": "https://www.spid.gov.it/SpidL2",
          ...aValidLollipopHeaders
        }
      };
      const run = CreateSignatureHandler({ ...buildDependencies(), input: req });
      await expect(run()).resolves.toEqual(
        expect.objectContaining({
          right: expect.objectContaining({ statusCode: 400 })
        })
      );
    });

    it("should return 403 when x-iosign-spid-level header is missing", async () => {
      const req: H.HttpRequest = {
        ...aValidRequest(),
        headers: {
          "x-iosign-fiscal-code": aFiscalCode,
          ...aValidLollipopHeaders
          // "x-iosign-spid-level" intentionally missing
        }
      };
      const run = CreateSignatureHandler({ ...buildDependencies(), input: req });
      await expect(run()).resolves.toEqual(
        expect.objectContaining({
          right: expect.objectContaining({ statusCode: 403 })
        })
      );
    });

    it("should return 400 when signature-input header is missing", async () => {
      const req: H.HttpRequest = {
        ...aValidRequest(),
        headers: {
          "x-iosign-fiscal-code": aFiscalCode,
          "x-iosign-spid-level": "https://www.spid.gov.it/SpidL3",
          signature: aValidSignature,
          "x-pagopa-lollipop-assertion-ref": anAssertionRef,
          "x-pagopa-lollipop-assertion-type": AssertionTypeEnum.SAML,
          "x-pagopa-lollipop-public-key": "a-public-key",
          "x-pagopa-lollipop-custom-tos-challenge": "tos-challenge-value",
          "x-pagopa-lollipop-custom-sign-challenge": "sign-challenge-value"
          // "signature-input" intentionally missing
        }
      };
      const run = CreateSignatureHandler({ ...buildDependencies(), input: req });
      await expect(run()).resolves.toEqual(
        expect.objectContaining({
          right: expect.objectContaining({ statusCode: 400 })
        })
      );
    });

    it("should return 400 when x-pagopa-lollipop-assertion-ref header is missing", async () => {
      const req: H.HttpRequest = {
        ...aValidRequest(),
        headers: {
          "x-iosign-fiscal-code": aFiscalCode,
          "x-iosign-spid-level": "https://www.spid.gov.it/SpidL3",
          "signature-input": aValidSignatureInput,
          signature: aValidSignature,
          "x-pagopa-lollipop-assertion-type": AssertionTypeEnum.SAML,
          "x-pagopa-lollipop-public-key": "a-public-key",
          "x-pagopa-lollipop-custom-tos-challenge": "tos-challenge-value",
          "x-pagopa-lollipop-custom-sign-challenge": "sign-challenge-value"
          // "x-pagopa-lollipop-assertion-ref" intentionally missing
        }
      };
      const run = CreateSignatureHandler({ ...buildDependencies(), input: req });
      await expect(run()).resolves.toEqual(
        expect.objectContaining({
          right: expect.objectContaining({ statusCode: 400 })
        })
      );
    });

    it("should return 400 when x-pagopa-lollipop-auth-jwt header is present but other required headers are missing (jwt is no longer required)", async () => {
      // Sanity check: providing jwt but missing assertion-ref still fails
      const req: H.HttpRequest = {
        ...aValidRequest(),
        headers: {
          "x-iosign-fiscal-code": aFiscalCode,
          "x-iosign-spid-level": "https://www.spid.gov.it/SpidL3",
          "signature-input": aValidSignatureInput,
          signature: aValidSignature,
          "x-pagopa-lollipop-auth-jwt": "some-jwt",  // present but irrelevant
          "x-pagopa-lollipop-assertion-type": AssertionTypeEnum.SAML,
          "x-pagopa-lollipop-public-key": "a-public-key",
          "x-pagopa-lollipop-custom-tos-challenge": "tos-challenge-value",
          "x-pagopa-lollipop-custom-sign-challenge": "sign-challenge-value"
          // "x-pagopa-lollipop-assertion-ref" intentionally missing
        }
      };
      const run = CreateSignatureHandler({ ...buildDependencies(), input: req });
      await expect(run()).resolves.toEqual(
        expect.objectContaining({
          right: expect.objectContaining({ statusCode: 400 })
        })
      );
    });
  });

  describe("dependency failures — 500 responses", () => {
    it("should return 500 when getLcParams fails (e.g. generateLCParams returns 403)", async () => {
      vi.mocked(makeGetLcParams).mockReturnValue(
        vi.fn().mockReturnValue(
          TE.left(new Error("generateLCParams failed with HTTP status 403"))
        )
      );

      const run = CreateSignatureHandler({
        ...buildDependencies(),
        input: aValidRequest()
      });
      await expect(run()).resolves.toEqual(
        expect.objectContaining({
          right: expect.objectContaining({ statusCode: 500 })
        })
      );
    });

    it("should return 404 when the signer cannot be found for the given fiscal code", async () => {
      const run = CreateSignatureHandler({
        ...buildDependencies({
          signerRepository: {
            getSignerByFiscalCode: () =>
              TE.left(new EntityNotFoundError("Signer not found")),
            getFiscalCodeBySignerId: () => TE.left(new Error("not implemented"))
          }
        }),
        input: aValidRequest()
      });
      await expect(run()).resolves.toEqual(
        expect.objectContaining({
          right: expect.objectContaining({ statusCode: 404 })
        })
      );
    });

    it("should return 500 when the SAML assertion retrieval fails", async () => {
      vi.mocked(makeGetBase64SamlAssertion).mockReturnValue(
        vi.fn().mockReturnValue(
          TE.left(new Error("Unable to retrieve the assertion from lollipop api."))
        )
      );

      const run = CreateSignatureHandler({
        ...buildDependencies(),
        input: aValidRequest()
      });
      await expect(run()).resolves.toEqual(
        expect.objectContaining({
          right: expect.objectContaining({ statusCode: 500 })
        })
      );
    });
  });
});
