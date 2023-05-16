import * as H from "@pagopa/handler-kit";

import { enqueue } from "@io-sign/io-sign/infra/azure/storage/queue";
import { EventName, createAndSendAnalyticsEvent } from "@io-sign/io-sign/event";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { pipe } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";

import { validate } from "@io-sign/io-sign/validation";

import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import { QueueClient } from "@azure/storage-queue";
import {
  SetSignatureRequestStatusBody,
  SetSignatureRequestStatusBodyEnum,
} from "../../http/models/SetSignatureRequestStatusBody";
import {
  SignatureRequest,
  getSignatureRequest,
  markAsCanceled,
  markAsReady,
  upsertSignatureRequest,
} from "../../../signature-request";
import { requireIssuer } from "../../http/decoders/issuer";
import { requireSignatureRequestId } from "../../http/decoders/signature-request";

const requireSetSignatureRequestStatusBody = (req: H.HttpRequest) =>
  pipe(
    req.body,
    validate(SetSignatureRequestStatusBody),
    E.filterOrElse(
      (status) => status === "READY" || status === "CANCELED",
      () => new Error("only READY or CANCELED is allowed")
    )
  );

const enqueueReadySignatureRequest =
  (signatureRequest: SignatureRequest) =>
  (r: { readyClient: QueueClient; canceledClient: QueueClient }) =>
    enqueue(signatureRequest)(r.readyClient);

const enqueueCanceledSignatureRequest =
  (signatureRequest: SignatureRequest) =>
  (r: { readyClient: QueueClient; canceledClient: QueueClient }) =>
    enqueue(signatureRequest)(r.canceledClient);

export const SetSignatureRequestStatusHandler = H.of((req: H.HttpRequest) =>
  pipe(
    sequenceS(RTE.ApplyPar)({
      signatureRequestId: requireSignatureRequestId(req),
      issuer: requireIssuer(req),
      body: pipe(requireSetSignatureRequestStatusBody(req), RTE.fromEither),
    }),
    RTE.bindW("signatureRequest", ({ signatureRequestId, issuer }) =>
      getSignatureRequest(signatureRequestId, issuer.id)
    ),
    RTE.chainW(({ signatureRequest, body }) => {
      if (body === SetSignatureRequestStatusBodyEnum.READY) {
        return pipe(
          signatureRequest,
          markAsReady,
          RTE.fromEither,
          RTE.chainW(upsertSignatureRequest),
          RTE.chainFirstW(
            createAndSendAnalyticsEvent(EventName.SIGNATURE_READY)
          ),
          RTE.chainW((req) =>
            enqueueReadySignatureRequest(req as SignatureRequest)
          )
        );
      } else {
        return pipe(
          signatureRequest,
          markAsCanceled(new Date()),
          RTE.fromEither,
          RTE.chainW(upsertSignatureRequest),
          RTE.chainW(enqueueCanceledSignatureRequest)
        );
      }
    }),
    RTE.map(() => H.empty),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
