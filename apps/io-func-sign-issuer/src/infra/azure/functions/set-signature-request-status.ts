import * as H from "@pagopa/handler-kit";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as RE from "fp-ts/lib/ReaderEither";

import * as azure from "handler-kit-legacy/lib/azure";
import { flow, pipe } from "fp-ts/lib/function";
import { HttpRequest } from "handler-kit-legacy/lib/http";
import { sequenceS } from "fp-ts/lib/Apply";

import { createHandler } from "handler-kit-legacy";

import { Database as CosmosDatabase } from "@azure/cosmos";
import { QueueClient } from "@azure/storage-queue";

import { validate } from "@io-sign/io-sign/validation";
import { requireSignatureRequestId } from "../../http/decoders/signature-request";
import { SetSignatureRequestStatusBody } from "../../http/models/SetSignatureRequestStatusBody";

import { requireIssuer } from "../../http/decoders/issuer";
import {
  getSignatureRequest,
  markAsReady,
  upsertSignatureRequest,
} from "../../../signature-request";
import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import { enqueue } from "@io-sign/io-sign/infra/azure/storage/queue";
import { EventName, createAndSendAnalyticsEvent } from "@io-sign/io-sign/event";

const requireSetSignatureRequestStatusBody = (req: H.HttpRequest) =>
  pipe(
    req.body,
    validate(SetSignatureRequestStatusBody), // H.parse?
    E.filterOrElse(
      (status) => status === "READY" || status === "REJECTED",
      () => new Error("only READY or REJECTED is allowed")
    ),
    RTE.fromEither // lascio?
  );

// this is the handler written with handler-kit. previous: makeSetSignatureRequestStatusHandler
const foo3 = (req: H.HttpRequest) =>
  pipe(
    sequenceS(RTE.ApplyPar)({
      signatureRequestId: requireSignatureRequestId(req),
      issuer: requireIssuer(req),
      body: requireSetSignatureRequestStatusBody(req),
    }),
    RTE.chainW(({ signatureRequestId, issuer }) =>
      getSignatureRequest(signatureRequestId, issuer.id)
    ),
    RTE.chainW(flow(markAsReady, RTE.fromEither)),
    RTE.chainW(upsertSignatureRequest),
    RTE.chainFirstW((request) =>
      pipe(EventName.SIGNATURE_READY, createAndSendAnalyticsEvent(request))
    ),
    RTE.chainW(enqueue),
    // queste due righe solo per farlo compilare
    RTE.map(flow(H.successJson, H.withStatusCode(201)))
    // RTE.orElseW(logErrorAndReturnResponse)
  );

export const SetSignatureRequestStatusHandler = H.of(foo3);

export const SetSignatureRequestStatusFunction = httpAzureFunction(
  SetSignatureRequestStatusHandler
);
