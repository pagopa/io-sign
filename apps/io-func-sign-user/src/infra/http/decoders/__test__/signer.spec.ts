import { newId } from "@io-sign/io-sign/id";
import { it, describe, expect } from "vitest";

import * as H from "@pagopa/handler-kit";

import { requireSignerId } from "../signer";

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
      }),
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
      }),
    );
  });
});
