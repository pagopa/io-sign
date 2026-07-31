import { it, describe, expect } from "vitest";

import * as H from "@pagopa/handler-kit";

import { requireSpidLevel } from "../signer";

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
