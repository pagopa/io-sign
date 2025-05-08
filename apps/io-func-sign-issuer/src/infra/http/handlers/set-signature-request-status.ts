import { QueueClient } from "@azure/storage-queue";
import { EventName, createAndSendAnalyticsEvent } from "@io-sign/io-sign/event";
import { enqueue } from "@io-sign/io-sign/infra/azure/storage/queue";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import { validate } from "@io-sign/io-sign/validation";
import * as H from "@pagopa/handler-kit";
import { sequenceS } from "fp-ts/lib/Apply";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import {
  SignatureRequest,
  getSignatureRequest,
  markAsCancelled,
  markAsReady,
  upsertSignatureRequest
} from "../../../signature-request";
import { requireIssuer } from "../../http/decoders/issuer";
import { requireSignatureRequestId } from "../../http/decoders/signature-request";
import {
  SetSignatureRequestStatusBody,
  SetSignatureRequestStatusBodyEnum
} from "../../http/models/SetSignatureRequestStatusBody";

const requireSetSignatureRequestStatusBody = (req: H.HttpRequest) =>
  pipe(
    req.body,
    validate(SetSignatureRequestStatusBody),
    E.filterOrElse(
      (status) => status === "READY" || status === "CANCELLED",
      () => new Error("only READY or CANCELLED are allowed")
    )
  );

const getQueue =
  (signatureRequest: SignatureRequest) =>
  (queueClient: { ready: QueueClient; updated: QueueClient }) => {
    if (signatureRequest.status === "READY") {
      return E.right(queueClient.ready);
    } else if (signatureRequest.status === "CANCELLED") {
      return E.right(queueClient.updated);
    } else {
      return E.left(new Error("There are no queues for this status update"));
    }
  };

const enqueueSignatureRequest =
  (signatureRequest: SignatureRequest) =>
  (queueClient: { ready: QueueClient; updated: QueueClient }) =>
    pipe(
      queueClient,
      getQueue(signatureRequest),
      TE.fromEither,
      TE.chain(enqueue(signatureRequest))
    );

export const SetSignatureRequestStatusHandler = H.of((req: H.HttpRequest) =>
  pipe(
    sequenceS(RTE.ApplyPar)({
      signatureRequestId: requireSignatureRequestId(req),
      issuer: requireIssuer(req),
      body: pipe(requireSetSignatureRequestStatusBody(req), RTE.fromEither)
    }),
    RTE.bindW("signatureRequest", ({ signatureRequestId, issuer }) =>
      getSignatureRequest(signatureRequestId, issuer.id)
    ),
    RTE.chainW(({ signatureRequest, body }) => {
      switch (body) {
        case SetSignatureRequestStatusBodyEnum.READY:
          return pipe(
            signatureRequest,
            markAsReady,
            RTE.fromEither,
            RTE.chainW(upsertSignatureRequest),
            RTE.chainFirstW((req) =>
              pipe(req, createAndSendAnalyticsEvent(EventName.SIGNATURE_READY))
            )
          );
        case SetSignatureRequestStatusBodyEnum.CANCELLED:
          return pipe(
            signatureRequest,
            markAsCancelled(new Date()),
            RTE.fromEither,
            RTE.chainW(upsertSignatureRequest)
          );
      }
    }),
    // the updated signature request will now be sent to the queue to reflect the change on user-side as well
    RTE.chainW(enqueueSignatureRequest),
    RTE.map(() => H.empty),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
