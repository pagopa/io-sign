import {
  HttpRequest as AzureHttpRequest,
  HttpResponse as AzureHttpResponse,
  InvocationContext
} from "@azure/functions";

import * as E from "fp-ts/lib/Either";
import * as H from "@pagopa/handler-kit";

import { IssuerRepository } from "../../../issuer";
import { SignatureRequestRepository } from "../../../signature-request";
import { QueueClient } from "@azure/storage-queue";
import { EventProducerClient } from "@io-sign/io-sign/event";
import { SetSignatureRequestStatusHandler } from "../../http/handlers/set-signature-request-status";
import { makeLogger } from "./logger";
import {
  errorResponse,
  toAzureHttpResponse,
  toHandlerKitRequest
} from "./http-helpers";

type SetSignatureRequestStatusDeps = {
  issuerRepository: IssuerRepository;
  signatureRequestRepository: SignatureRequestRepository;
  eventAnalyticsClient: EventProducerClient;
  ready: QueueClient;
  updated: QueueClient;
};

export const SetSignatureRequestStatusFunction =
  (deps: SetSignatureRequestStatusDeps) =>
  async (
    request: AzureHttpRequest,
    ctx: InvocationContext
  ): Promise<AzureHttpResponse> => {
    const rawText = await request.text();
    let body: unknown;
    try {
      body = JSON.parse(rawText);
    } catch {
      body = rawText;
    }

    const httpRequest = toHandlerKitRequest(request, body);

    const result = await SetSignatureRequestStatusHandler({
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
