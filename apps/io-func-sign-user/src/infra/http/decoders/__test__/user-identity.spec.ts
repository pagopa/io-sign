import { it, describe, expect } from "vitest";

import * as H from "@pagopa/handler-kit";

import { requireFamilyName, requireName } from "../user-identity";

describe("requireName", () => {
  it('should correctly parse the "x-iosign-name" header', () => {
    const req: H.HttpRequest = {
      ...H.request("my-url"),
      headers: { "x-iosign-name": "Mario" }
    };
    expect(requireName(req)).toEqual(
      expect.objectContaining({
        right: "Mario"
      })
    );
  });

  it("fails with an Http Bad Request error when header is not found", () => {
    const req = H.request("my-url");
    expect(requireName(req)).toEqual(
      expect.objectContaining({
        left: expect.objectContaining({
          name: "HttpError",
          status: 400
        })
      })
    );
  });
});

describe("requireFamilyName", () => {
  it('should correctly parse the "x-iosign-family-name" header', () => {
    const req: H.HttpRequest = {
      ...H.request("my-url"),
      headers: { "x-iosign-family-name": "Rossi" }
    };
    expect(requireFamilyName(req)).toEqual(
      expect.objectContaining({
        right: "Rossi"
      })
    );
  });

  it("fails with an Http Bad Request error when header is not found", () => {
    const req = H.request("my-url");
    expect(requireFamilyName(req)).toEqual(
      expect.objectContaining({
        left: expect.objectContaining({
          name: "HttpError",
          status: 400
        })
      })
    );
  });
});
