import { describe, expect, it, vi } from "vitest";

import * as L from "@pagopa/logger";
import * as H from "@pagopa/handler-kit";

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import { newId } from "@io-sign/io-sign/id";
import { IOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import { SignerRepository } from "@io-sign/io-sign/signer";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import {
  AccessControlRepository,
  ApiKeyAccessControl
} from "../../../../access-control";
import { GetSignerHandler } from "../get-signer";

const subscriptionId = newId();
const signerId = "signer-id" as NonEmptyString;
const tester = "AAAAAA00A00A000A";
const other = "BBBBBB00B00B000B";

const logger: L.Logger = {
  log: () => () => {},
  format: L.format.simple
};

const makeIoApiClient = (senderAllowed = true) =>
  ({
    client: {
      getProfile: vi.fn(async () =>
        E.right({ status: 200, value: { sender_allowed: senderAllowed } })
      )
    },
    baseUrl: "https://io.test"
  }) as unknown as IOApiClient;

const makeSignerRepository = () => {
  const getSignerByFiscalCode = vi.fn(() => TE.right({ id: signerId }));
  const repository: SignerRepository = {
    getSignerByFiscalCode,
    getFiscalCodeBySignerId: () => TE.left(new Error("not implemented"))
  };
  return { repository, getSignerByFiscalCode };
};

const makeAccessControlRepository = (
  result: ApiKeyAccessControl | Error
): AccessControlRepository => ({
  getApiKeyAccessControl: () =>
    result instanceof Error ? TE.left(result) : TE.right(result)
});

const makeRequest = (
  fiscalCode: string,
  headers: Record<string, string> = { "x-subscription-id": subscriptionId }
): H.HttpRequest => ({
  ...H.request("https://api.test.it/signers"),
  method: "POST",
  headers,
  body: { fiscal_code: fiscalCode }
});

const run = (
  req: H.HttpRequest,
  accessControlRepository: AccessControlRepository,
  ioApiClient = makeIoApiClient()
) => {
  const { repository, getSignerByFiscalCode } = makeSignerRepository();
  const response = GetSignerHandler({
    logger,
    signerRepository: repository,
    ioApiClient,
    accessControlRepository,
    input: req,
    inputDecoder: H.HttpRequest
  })();
  return { response, getSignerByFiscalCode, ioApiClient };
};

describe("GetSignerHandler", () => {
  it("returns 200 with the signer id when the environment is prod", async () => {
    const { response, getSignerByFiscalCode } = run(
      makeRequest(other),
      makeAccessControlRepository({ environment: "prod", testers: [] })
    );
    expect(await response).toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 200,
          body: { id: signerId }
        })
      })
    );
    expect(getSignerByFiscalCode).toHaveBeenCalledWith(other);
  });

  it("returns 200 when the environment is test and the fiscal code is a tester", async () => {
    const { response } = run(
      makeRequest(tester),
      makeAccessControlRepository({ environment: "test", testers: [tester] })
    );
    expect(await response).toEqual(
      expect.objectContaining({
        right: expect.objectContaining({ statusCode: 200 })
      })
    );
  });

  it("returns 403 and does not call IO nor the tokenizer when the fiscal code is not a tester", async () => {
    const { response, getSignerByFiscalCode, ioApiClient } = run(
      makeRequest(other),
      makeAccessControlRepository({ environment: "test", testers: [tester] })
    );
    expect(await response).toEqual(
      expect.objectContaining({
        right: expect.objectContaining({ statusCode: 403 })
      })
    );
    expect(ioApiClient.client.getProfile).not.toHaveBeenCalled();
    expect(getSignerByFiscalCode).not.toHaveBeenCalled();
  });

  it("does not let anyone through when the back office fails", async () => {
    const { response, getSignerByFiscalCode } = run(
      makeRequest(tester),
      makeAccessControlRepository(new Error("back office unavailable"))
    );
    expect(await response).toEqual(
      expect.objectContaining({
        right: expect.objectContaining({ statusCode: 500 })
      })
    );
    expect(getSignerByFiscalCode).not.toHaveBeenCalled();
  });

  it("returns 400 when the x-subscription-id header is missing", async () => {
    const { response } = run(
      makeRequest(tester, {}),
      makeAccessControlRepository({ environment: "prod", testers: [] })
    );
    expect(await response).toEqual(
      expect.objectContaining({
        right: expect.objectContaining({ statusCode: 400 })
      })
    );
  });

  it("returns an error when the fiscal code is not valid", async () => {
    const { response } = run(
      makeRequest("not-a-fiscal-code"),
      makeAccessControlRepository({ environment: "prod", testers: [] })
    );
    expect(await response).toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: expect.toSatisfy((s: number) => s >= 400 && s < 500)
        })
      })
    );
  });

  it("returns 400 when the IO profile does not allow the sender", async () => {
    const { response, getSignerByFiscalCode } = run(
      makeRequest(tester),
      makeAccessControlRepository({ environment: "prod", testers: [] }),
      {
        client: {
          getProfile: vi.fn(async () => E.right({ status: 403 }))
        },
        baseUrl: "https://io.test"
      } as unknown as IOApiClient
    );
    expect(await response).toEqual(
      expect.objectContaining({
        right: expect.objectContaining({ statusCode: 400 })
      })
    );
    expect(getSignerByFiscalCode).not.toHaveBeenCalled();
  });
});
