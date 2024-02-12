import { flow, pipe } from "fp-ts/lib/function";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { NotificationMessage } from "@io-sign/io-sign/notification";
import {
  createAndSendAnalyticsEvent,
  createBillingEvent,
  EventName,
  sendBillingEvent,
} from "@io-sign/io-sign/event";

import { sendTelemetryEvent } from "@io-sign/io-sign/telemetry";
import { SignatureRequestSigned } from "@io-sign/io-sign/signature-request";
import { sendSignatureRequestNotification } from "../../signature-request-notification";
import {
  ClosedSignatureRequest,
  getSignatureRequest,
  markAsRejected,
  markAsSigned,
  SignatureRequest,
  upsertSignatureRequest,
} from "../../signature-request";

// TODO(): move here the signature request cancelation logic
// since CANCELLED is an "end status" such as SIGNED and REJECTED
// it should be treated in the same way, so:
// - the user should be notified by a Message
// - we should send a "CANCELLED" event to analytics

const buildNotificationMessage = (
  request: SignatureRequest
): NotificationMessage => {
  const prefix = `${request.issuerDescription} - ${request.dossierTitle}`;
  const supportEmail = `[${request.issuerEmail}](mailto:${request.issuerEmail})`;
  if (request.status === "SIGNED") {
    return {
      subject: `${prefix} - Documenti firmati`,
      markdown: `I documenti che hai firmato sono pronti!\n\n\nHai **90 giorni** dalla ricezione di questo messaggio per visualizzarli e salvarli sul tuo dispositivo.\n\n\nSe hai dei problemi che riguardano il contenuto del documento, scrivi a ${supportEmail}.`,
      signatureRequestId: request.id,
    };
  }
  return {
    subject: `${prefix} - C'è un problema con la firma`,
    markdown: `A causa di un problema tecnico, la firma non è andata a buon fine.\n\n\nL’ente mittente ti contatterà nei prossimi giorni per farti firmare di nuovo. Se ciò non dovesse succedere, scrivi a ${supportEmail}.`,
  };
};

const markRequestAsClosed = (closed: ClosedSignatureRequest) => {
  // eslint-ignore-next-line sonarjs/no-small-switch
  switch (closed.status) {
    case "SIGNED":
      return markAsSigned;
    case "REJECTED":
      return markAsRejected(closed.rejectedAt, closed.rejectReason);
  }
};

const eventNameByRequestStatus: Record<
  ClosedSignatureRequest["status"],
  EventName
> = {
  SIGNED: EventName.SIGNATURE_SIGNED,
  REJECTED: EventName.SIGNATURE_REJECTED,
};

const sendNotification = sendSignatureRequestNotification(
  buildNotificationMessage
);

// "closeSignatureRequest" ends the Signature Request lifecycle
export const closeSignatureRequest = (request: ClosedSignatureRequest) =>
  pipe(
    // 1. retrieve and update the request
    getSignatureRequest(request.id, request.issuerId),
    RTE.chainEitherKW(markRequestAsClosed(request)),
    RTE.chain(upsertSignatureRequest),
    RTE.chainFirstReaderTaskKW(sendNotification),
    RTE.chainFirstW(
      pipe(
        eventNameByRequestStatus[request.status],
        createAndSendAnalyticsEvent
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
          sendTelemetryEvent(EventName.SIGNATURE_REJECTED, {
            signatureRequestId: request.id,
          })
        ),
        RTE.altW(() => RTE.right(void 0))
      )
    ),
    // only if the closed request is in SIGNED status
    RTE.chainW(
      flow(
        RTE.fromPredicate(
          (closed): closed is SignatureRequestSigned =>
            closed.status === "SIGNED",
          () => new Error("to continue should be SIGNED")
        ),
        RTE.chainFirstW((request) =>
          pipe(createBillingEvent(request), sendBillingEvent)
        ),
        RTE.altW(() => RTE.right(void 0))
      )
    )
  );
