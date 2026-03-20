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

import { IssuerRepository } from "../../../issuer";
import { validateDocumentHandler } from "../../http/handlers/validate-document";
import { makeLogger } from "./logger";
import {
  errorResponse,
  toAzureHttpResponse,
  toHandlerKitRequest
} from "./http-helpers";

type ValidateDocumentDeps = {
  issuerRepository: IssuerRepository;
};

export const validateDocumentFunction =
  (deps: ValidateDocumentDeps) =>
  async (
    request: AzureHttpRequest,
    ctx: InvocationContext
  ): Promise<AzureHttpResponse> => {
    const rawBody = Buffer.from(await request.arrayBuffer());
    const httpRequest = toHandlerKitRequest(request, rawBody);

    const result = await validateDocumentHandler({
      input: httpRequest,
      inputDecoder: H.HttpRequest,
      logger: makeLogger(ctx),
      ...deps
    })();

    if (E.isLeft(result)) {
      return errorResponse(result.left);
    }

    return toAzureHttpResponse(result.right);
  };
