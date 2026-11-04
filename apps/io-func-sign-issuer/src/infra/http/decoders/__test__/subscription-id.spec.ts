import { describe, expect, it } from "vitest";

import * as H from "@pagopa/handler-kit";
import * as E from "fp-ts/lib/Either";

import { newId } from "@io-sign/io-sign/id";

import { requireSubscriptionId } from "../subscription-id";

const makeRequest = (headers: Record<string, string>): H.HttpRequest => ({
  ...H.request("https://api.test.it/"),
  headers
});

describe("requireSubscriptionId", () => {
  it("returns the subscription id found in the x-subscription-id header", () => {
    const subscriptionId = newId();
    expect(
      requireSubscriptionId(
        makeRequest({ "x-subscription-id": subscriptionId })
      )
    ).toEqual(E.right(subscriptionId));
  });

  it("returns a 400 error when the header is missing", () => {
    expect(requireSubscriptionId(makeRequest({}))).toEqual(
      E.left(
        expect.objectContaining({
          name: "HttpError",
          status: 400,
          message: "Missing x-subscription-id in header"
        })
      )
    );
  });

  it("returns an error when the header is not a valid id", () => {
    expect(
      requireSubscriptionId(makeRequest({ "x-subscription-id": "" }))
    ).toEqual(E.left(expect.any(Error)));
  });
});
