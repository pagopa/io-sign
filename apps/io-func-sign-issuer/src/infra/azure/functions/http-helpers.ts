import {
  HttpRequest as AzureHttpRequest,
  HttpResponse as AzureHttpResponse
} from "@azure/functions";
import * as H from "@pagopa/handler-kit";
import { pipe } from "fp-ts/lib/function";

export const toHandlerKitRequest = (
  request: AzureHttpRequest,
  body: unknown
): H.HttpRequest => {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const query: Record<string, string> = {};
  request.query.forEach((value, key) => {
    query[key] = value;
  });
  return {
    body,
    url: request.url,
    path: request.params,
    headers,
    query,
    method: request.method as H.HttpRequest["method"]
  };
};

export const toAzureHttpResponse = (res: {
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

export const errorResponse = (_e: Error): AzureHttpResponse =>
  pipe(
    new H.HttpError("Something went wrong."),
    H.toProblemJson,
    H.problemJson,
    toAzureHttpResponse
  );
