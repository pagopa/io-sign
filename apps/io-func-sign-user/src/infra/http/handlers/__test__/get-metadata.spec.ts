import { describe, expect, it } from "vitest";

import * as L from "@pagopa/logger";
import * as H from "@pagopa/handler-kit";

import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { GetMetadataHandler } from "../get-metadata";

const logger: L.Logger = {
  log: () => () => {},
  format: L.format.simple,
};

const ioSignServiceId = "01234567890abcdef" as NonEmptyString;

const dependencies = {
  ioSignServiceId,
  logger,
  inputDecoder: H.HttpRequest,
};

describe("GetMetadataHandler", () => {
  it("should return 200 with serviceId when x-iosign-fiscal-code header is present", () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-iosign-fiscal-code": "RSSMRA85T10A562S" as FiscalCode,
      },
    };
    const run = GetMetadataHandler({
      ...dependencies,
      input: req,
    });
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 200,
          body: { serviceId: ioSignServiceId },
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      })
    );
  });

  it("should return 400 when x-iosign-fiscal-code header is missing", () => {
    const req: H.HttpRequest = H.request("https://api.test.it/");
    const run = GetMetadataHandler({
      ...dependencies,
      input: req,
    });
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 400,
          headers: expect.objectContaining({
            "Content-Type": "application/problem+json",
          }),
        }),
      })
    );
  });

  it("should return 422 when x-iosign-fiscal-code header contains an invalid fiscal code", () => {
    const req: H.HttpRequest = {
      ...H.request("https://api.test.it/"),
      headers: {
        "x-iosign-fiscal-code": "NOT-A-FISCAL-CODE",
      },
    };
    const run = GetMetadataHandler({
      ...dependencies,
      input: req,
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
});
