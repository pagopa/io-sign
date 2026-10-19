import { pipe } from "fp-ts/lib/function";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as L from "@pagopa/logger";

import {
  Notification,
  NotificationMessage
} from "@io-sign/io-sign/notification";
import { truncateWithEllipsis } from "@io-sign/io-sign/utility";
import { SignatureRequest, upsertSignatureRequest } from "./signature-request";

import { sendSignatureRequestNotification } from "./signature-request-notification";

const truncateTo120Chars = truncateWithEllipsis();

const buildNotificationMessage = (
  request: SignatureRequest
): NotificationMessage => {
  const supportEmail = `[${request.issuerEmail}](mailto:${request.issuerEmail})`;
  if (request.status === "SIGNED") {
    return {
      subject: truncateTo120Chars(
        `Ecco i documenti firmati - ${request.issuerDescription}`
      ),
      markdown: `I documenti che hai firmato sono pronti!\n\n\nHai **90 giorni** dalla ricezione di questo messaggio per visualizzarli e salvarli sul tuo dispositivo.\n\n\nSe hai dei problemi che riguardano il contenuto del documento, scrivi a ${supportEmail}.`,
      signatureRequestId: request.id
    };
  }
  return {
    subject: truncateTo120Chars(
      `C'è un problema con la firma - ${request.issuerDescription}`
    ),
    markdown: `Per un problema tecnico, non è stato possibile completare la firma per **${request.dossierTitle}**.\n\n\nAttendi un nuovo messaggio per firmare. Se non lo ricevi, puoi contattare l'ente all'indirizzo ${supportEmail}.`
  };
};

// Sends the notification to the citizen and returns the request
// with the sent notification set as outcomeNotification
export const sendNotification = (signatureRequest: SignatureRequest) =>
  pipe(
    signatureRequest,
    sendSignatureRequestNotification(buildNotificationMessage),
    RTE.orElseFirstW((error) =>
      L.errorRTE(
        "Unable to send the signature request notification to the citizen",
        {
          signatureRequestId: signatureRequest.id,
          error: error.message
        }
      )
    ),
    RTE.map((outcomeNotification) => ({
      ...signatureRequest,
      outcomeNotification
    }))
  );

// Saves the sent outcome notification (IO message id) on the signature request
export const saveMessageId = (
  requestWithOutcomeNotification: SignatureRequest & {
    outcomeNotification: Notification;
  }
) =>
  pipe(
    upsertSignatureRequest(requestWithOutcomeNotification),
    RTE.orElseFirstW((error) =>
      L.errorRTE("Unable to save the signature request outcome notification", {
        signatureRequestId: requestWithOutcomeNotification.id,
        ioMessageId:
          requestWithOutcomeNotification.outcomeNotification.ioMessageId,
        error: error.message
      })
    )
  );
