import { newId } from "@io-sign/io-sign/id";
import { it, describe, expect } from "vitest";

import * as H from "@pagopa/handler-kit";

import { requireSignerId, requireSpidLevel } from "../signer";

describe("requireSignerId", () => {
  it('should correctly parse the "x-iosign-signer-id" header', () => {
    const signerId = newId();
    const req: H.HttpRequest = {
      ...H.request("my-url"),
      headers: { "x-iosign-signer-id": signerId },
    };
    expect(requireSignerId(req)).toEqual(
      expect.objectContaining({
        right: signerId,
      })
    );
  });
  it("fails with an Http Bad Request error when header is not found", () => {
    const req = H.request("my-url");
    expect(requireSignerId(req)).toEqual(
      expect.objectContaining({
        left: expect.objectContaining({
          name: "HttpError",
          status: 400,
        }),
      })
    );
  });
});

describe("requireSpidLevel", () => {
  it("returns the SPID level when the header is SpidL3", () => {
    const req: H.HttpRequest = {
      ...H.request("my-url"),
      headers: {
        "x-iosign-spid-level": "https://www.spid.gov.it/SpidL3",
      },
    };
    expect(requireSpidLevel(req)).toEqual(
      expect.objectContaining({
        right: "https://www.spid.gov.it/SpidL3",
      })
    );
  });

  it.each([
    {
      label: "SPID level is L1",
      headers: { "x-iosign-spid-level": "https://www.spid.gov.it/SpidL1" },
    },
    {
      label: "SPID level is L2",
      headers: { "x-iosign-spid-level": "https://www.spid.gov.it/SpidL2" },
    },
    { label: "header is missing", headers: {} as Record<string, string> },
  ])("fails with a 403 error when $label", ({ headers }) => {
    const req: H.HttpRequest = {
      ...H.request("my-url"),
      headers,
    };
    expect(requireSpidLevel(req)).toEqual(
      expect.objectContaining({
        left: expect.objectContaining({
          name: "HttpError",
          status: 403,
        }),
      })
    );
  });

  it("fails with a validation error when the header value is not a valid SPID level", () => {
    const req: H.HttpRequest = {
      ...H.request("my-url"),
      headers: {
        "x-iosign-spid-level": "not-a-valid-spid-level",
      },
    };
    expect(requireSpidLevel(req)).toEqual(
      expect.objectContaining({
        left: expect.objectContaining({
          name: "ValidationError",
        }),
      })
    );
  });
});
