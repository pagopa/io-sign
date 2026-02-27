import { HttpRequest, HttpResponse } from "@azure/functions";

import * as H from "@pagopa/handler-kit";
import * as E from "fp-ts/lib/Either";
import * as T from "fp-ts/lib/Task";
import { pipe } from "fp-ts/lib/function";

import { ConsoleLogger } from "@io-sign/io-sign/infra/console-logger";

import {
  GetThirdPartyMessageAttachmentContentDependencies,
  GetThirdPartyMessageAttachmentContentHandler
} from "../../http/handlers/get-third-party-message-attachments-content";

const toAzureRequest = (request: HttpRequest): H.HttpRequest => {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, name) => {
    headers[name] = value;
  });
  return {
    method: request.method as H.HttpRequest["method"],
    url: request.url,
    // Azure Functions v4 uses "params" for path parameters; handler-kit uses "path"
    path: request.params,
    headers,
    query: Object.fromEntries(request.query),
    body: undefined
  };
};

const toAzureResponse = (
  response: H.HttpResponse<unknown, H.HttpStatusCode>
): HttpResponse => {
  const { statusCode, body, headers } = response;
  if (Buffer.isBuffer(body)) {
    return new HttpResponse({
      status: statusCode,
      // Buffer extends Uint8Array (ArrayBufferView) which is a valid HttpResponseBodyInit
      body: body as Uint8Array,
      headers
    });
  }
  if (
    headers["Content-Type"] === "application/json" ||
    headers["Content-Type"] === "application/problem+json"
  ) {
    return new HttpResponse({ status: statusCode, jsonBody: body, headers });
  }
  return new HttpResponse({
    status: statusCode,
    body: typeof body === "string" ? body : null,
    headers
  });
};

export const GetThirdPartyMessageAttachmentContentFunction =
  (deps: GetThirdPartyMessageAttachmentContentDependencies) =>
  async (request: HttpRequest): Promise<HttpResponse> =>
    pipe(
      GetThirdPartyMessageAttachmentContentHandler({
        ...deps,
        logger: ConsoleLogger,
        input: toAzureRequest(request),
        inputDecoder: H.HttpRequest
      }),
      T.map(
        E.fold(
          (e) => toAzureResponse(pipe(e, H.toProblemJson, H.problemJson)),
          toAzureResponse
        )
      )
    )();
