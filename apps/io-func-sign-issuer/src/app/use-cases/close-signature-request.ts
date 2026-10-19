import { flow, pipe } from "fp-ts/lib/function";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { sendTelemetryEvent } from "@io-sign/io-sign/telemetry";
import {
  ClosedSignatureRequest,
  getSignatureRequest,
  markAsRejected,
  markAsSigned,
  upsertSignatureRequest
} from "../../signature-request";
import {
  createAndSendSignEvent,
  EventName,
  eventNameByRequestStatus
} from "@io-sign/io-sign/sign-event";
import { saveMessageId, sendNotification } from "../../outcome-notification";

// TODO(SFEQS-2108): move here the signature request cancelation logic
// since CANCELLED is an "end status" such as SIGNED and REJECTED
// it should be treated in the same way, so:
// - the user should be notified by a Message
// - we should send a "CANCELLED" event to analytics

const markRequestAsClosed = (closed: ClosedSignatureRequest) => {
  // eslint-ignore-next-line sonarjs/no-small-switch
  switch (closed.status) {
    case "REJECTED":
      return markAsRejected(closed.rejectedAt, closed.rejectReason);
    case "SIGNED":
      return markAsSigned;
  }
};

// "closeSignatureRequest" ends the Signature Request lifecycle
export const closeSignatureRequest = (request: ClosedSignatureRequest) =>
  pipe(
    // 1. retrieve and update the request
    getSignatureRequest(request.id, request.issuerId),
    RTE.chainW((currentRequest) => {
      if (request.status === "SIGNED" && currentRequest.status === "SIGNED") {
        return RTE.right(currentRequest);
      }

      return pipe(
        RTE.right(currentRequest),
        RTE.chainEitherKW(markRequestAsClosed(request)),
        RTE.chain(upsertSignatureRequest),
        // 2. notify the citizen and save the outcomeNotification.
        // Failures are only logged since this is a fire and forget
        RTE.chainFirstW((signatureRequest) =>
          pipe(
            sendNotification(signatureRequest),
            RTE.chainW(saveMessageId),
            // errors are already logged, the request closure must go on
            RTE.orElseW(() => RTE.right(undefined))
          )
        ),
        RTE.chainFirstW((req) =>
          pipe(
            req,
            createAndSendSignEvent(eventNameByRequestStatus[req.status])
          )
        ),
        // only if the closed request is in REJECTED status
        RTE.chainFirstW(
          flow(
            RTE.fromPredicate(
              (closed) => closed.status === "REJECTED",
              () => new Error("to continue should be REJECTED")
            ),
            RTE.chainReaderIOK((request) =>
              sendTelemetryEvent(
                EventName.SIGNATURE_REJECTED,
                {
                  properties: {
                    signatureRequestId: request.id,
                    environment: request.issuerEnvironment
                  }
                },
                {
                  sampling: false
                }
              )
            ),
            RTE.altW(() => RTE.right(void 0))
          )
        )
      );
    })
  );
