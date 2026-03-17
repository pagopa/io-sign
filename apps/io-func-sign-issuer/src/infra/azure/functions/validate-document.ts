// This Azure Function checks if a "PDF DOCUMENT" is a valid "DOCUMENT" according
// to the business rules of io-sign.
// To simplify its use by issues it is implemented as non-RESTFUL endpoint
//
// NOTE: httpAzureFunction (v2) calls request.json() which falls back to undefined
// for multipart bodies, breaking H.parseMultipart. We bypass it and read the raw
// body with request.arrayBuffer() instead.

import {
  HttpRequest as AzureHttpRequest,
  HttpResponse as AzureHttpResponse,
  InvocationContext
} from "@azure/functions";

import * as E from "fp-ts/lib/Either";
import * as H from "@pagopa/handler-kit";
import { pipe } from "fp-ts/lib/function";

import { IssuerRepository } from "../../../issuer";
import { validateDocumentHandler } from "../../http/handlers/validate-document";
import { makeLogger } from "./logger";

type ValidateDocumentDeps = {
  issuerRepository: IssuerRepository;
};

const toAzureHttpResponse = (res: {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
}): AzureHttpResponse => {
  const { statusCode, body, headers } = res;
  if (
    headers["Content-Type"] === "application/json" ||
    headers["Content-Type"] === "application/problem+json"
  ) {
    return new AzureHttpResponse({
      status: statusCode,
      jsonBody: body,
      headers
    });
  }
  if (typeof body === "string" || body === null) {
    return new AzureHttpResponse({ status: statusCode, body, headers });
  }
  return new AzureHttpResponse({
    status: 500,
    body: "Internal server error",
    headers: { "Content-Type": "application/problem+json" }
  });
};

export const validateDocumentFunction =
  (deps: ValidateDocumentDeps) =>
  async (
    request: AzureHttpRequest,
    ctx: InvocationContext
  ): Promise<AzureHttpResponse> => {
    const rawBody = Buffer.from(await request.arrayBuffer());
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    const query: Record<string, string> = {};
    request.query.forEach((value, key) => {
      query[key] = value;
    });

    const httpRequest: H.HttpRequest = {
      body: rawBody,
      url: request.url,
      path: request.params,
      headers,
      query,
      method: request.method as H.HttpRequest["method"]
    };

    const result = await validateDocumentHandler({
      input: httpRequest,
      inputDecoder: H.HttpRequest,
      logger: makeLogger(ctx),
      ...deps
    })();

    if (E.isLeft(result)) {
      return pipe(
        new H.HttpError("Something went wrong."),
        H.toProblemJson,
        H.problemJson,
        toAzureHttpResponse
      );
    }

    return toAzureHttpResponse(result.right);
  };
