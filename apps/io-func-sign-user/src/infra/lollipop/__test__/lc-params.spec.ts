import { describe, it, expect, vi } from "vitest";
import * as E from "fp-ts/lib/Either";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { makeGetLcParams } from "../lc-params";
import type { LollipopApiClientInt, LcParams } from "../lc-params";
import { AssertionTypeEnum } from "../models/AssertionType";

// A valid AssertionRef (sha256 prefix + 44 base64url chars)
const anAssertionRef = "sha256-n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg" as NonEmptyString;

// signature-input WITH a nonce field — required by makeGetLcParams
const aSignatureInputWithNonce =
  `sig1=("@method");created=1618884475;nonce="test-operation-id";keyid="test-key"`;

// signature-input WITHOUT a nonce field
const aSignatureInputWithoutNonce =
  `sig1=("@method");created=1618884475;keyid="test-key"`;

const aLcParams: LcParams = {
  assertion_ref: anAssertionRef as unknown as LcParams["assertion_ref"],
  assertion_type: AssertionTypeEnum.SAML,
  lc_authentication_bearer: "a-bearer-jwt" as NonEmptyString,
  pub_key: "base64url-encoded-jwk" as NonEmptyString
};

/** Build a minimal LollipopApiClientInt with the given mock fetchApi */
const buildClient = (fetchFn: typeof fetch): LollipopApiClientInt => ({
  baseUrl: "https://lollipop-internal.example.com" as NonEmptyString,
  apiKey: "test-api-key" as NonEmptyString,
  fetchApi: fetchFn
});

describe("makeGetLcParams", () => {
  it("returns Right(LcParams) on a successful 200 response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => aLcParams
    });

    const result = await makeGetLcParams(buildClient(mockFetch as unknown as typeof fetch))({
      assertionRef: anAssertionRef as unknown as LcParams["assertion_ref"],
      signatureInput: aSignatureInputWithNonce
    })();

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right).toEqual(aLcParams);
    }
  });

  it("calls the correct endpoint URL with the nonce as operation_id in the body", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => aLcParams
    });

    await makeGetLcParams(buildClient(mockFetch as unknown as typeof fetch))({
      assertionRef: anAssertionRef as unknown as LcParams["assertion_ref"],
      signatureInput: aSignatureInputWithNonce
    })();

    expect(mockFetch).toHaveBeenCalledWith(
      `https://lollipop-internal.example.com/api/v1/pubKeys/${anAssertionRef}/generate`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-Functions-Key": "test-api-key"
        }),
        body: JSON.stringify({ operation_id: "test-operation-id" })
      })
    );
  });

  it("returns Left and does not call fetch when nonce is missing from signature-input", async () => {
    const mockFetch = vi.fn();

    const result = await makeGetLcParams(buildClient(mockFetch as unknown as typeof fetch))({
      assertionRef: anAssertionRef as unknown as LcParams["assertion_ref"],
      signatureInput: aSignatureInputWithoutNonce
    })();

    expect(E.isLeft(result)).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns Left when the API responds with a non-2xx status (e.g. 403)", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403
    });

    const result = await makeGetLcParams(buildClient(mockFetch as unknown as typeof fetch))({
      assertionRef: anAssertionRef as unknown as LcParams["assertion_ref"],
      signatureInput: aSignatureInputWithNonce
    })();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toContain("403");
    }
  });

  it("returns Left when the response body does not conform to LcParams", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ unexpected: "shape" })
    });

    const result = await makeGetLcParams(buildClient(mockFetch as unknown as typeof fetch))({
      assertionRef: anAssertionRef as unknown as LcParams["assertion_ref"],
      signatureInput: aSignatureInputWithNonce
    })();

    expect(E.isLeft(result)).toBe(true);
  });

  it("returns Left when the fetch call itself rejects (network error)", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const result = await makeGetLcParams(buildClient(mockFetch as unknown as typeof fetch))({
      assertionRef: anAssertionRef as unknown as LcParams["assertion_ref"],
      signatureInput: aSignatureInputWithNonce
    })();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toBe("Network error");
    }
  });
});
