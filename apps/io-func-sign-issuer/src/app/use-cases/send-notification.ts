import { pipe } from "fp-ts/lib/function";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as t from "io-ts";

import { SignerRepository } from "@io-sign/io-sign/signer";
import { format } from "date-fns";

import {
  NotificationMessage,
  NotificationService
} from "@io-sign/io-sign/notification";

import { validate } from "@io-sign/io-sign/validation";
import { sequenceS } from "fp-ts/lib/Apply";

import { makeSignatureRequestVariant } from "@io-sign/io-sign/signature-request";

import { DocumentReady } from "@io-sign/io-sign/document";
import { CreateAndSendAnalyticsEvent, EventName } from "@io-sign/io-sign/event";
import { Notification } from "@io-sign/io-sign/notification";
import {
  SignatureRequest,
  UpsertSignatureRequest
} from "../../signature-request";

import { truncateWithEllipsis } from "@io-sign/io-sign/utility";
import { sendSignatureRequestNotification } from "../../signature-request-notification";

const truncateTo120Chars = truncateWithEllipsis();

const requestToSignMessage = (
  signatureRequest: SignatureRequest
): NotificationMessage => ({
  subject: truncateTo120Chars(
    `Hai un documento da firmare - ${signatureRequest.issuerDescription}`
  ),
  markdown: `---\nit:\n    cta_1: \n        text: "Inizia"\n        action: "ioit://FCI_MAIN?signatureRequestId=${
    signatureRequest.id
  }"\nen:\n    cta_1: \n        text: "Start"\n        action: "ioit://FCI_MAIN?signatureRequestId=${
    signatureRequest.id
  }"\n---\nHai ricevuto una richiesta per firmare **${signatureRequest.documents.length}** ${signatureRequest.documents.length === 1 ? "documento relativo" : "documenti relativi"} a **${
    signatureRequest.dossierTitle
  }** da **${signatureRequest.issuerDescription}**.\n\n\nPuoi firmare **fino alle ${format(
    signatureRequest.expiresAt,
    "HH:mm"
  )} del ${format(
    signatureRequest.expiresAt,
    "dd/MM/yyyy"
  )}**.\n\n\n# Cosa serve\n\nPer firmare digitalmente è richiesto un livello di sicurezza massimo ([livello di sicurezza 3](https://assistenza.ioapp.it/hc/it/articles/30722976684049-Cosa-sono-i-livelli-di-sicurezza)).\nDovrai quindi usare la tua Carta di Identità Elettronica e il PIN per firmare.\n\n\nSe hai dei problemi che riguardano il contenuto del documento, scrivi a [${
    signatureRequest.issuerEmail
  }](mailto:${signatureRequest.issuerEmail}).`
});

const SignatureRequestReadyToNotify = makeSignatureRequestVariant(
  "WAIT_FOR_SIGNATURE",
  t.type({
    qrCodeUrl: t.string,
    documents: t.array(DocumentReady),
    notification: t.undefined
  })
);

type SendNotificationResult =
  | { sent: true; notification: Notification }
  | { sent: false; error: Error };

export const makeSendNotification =
  (
    signerRepository: SignerRepository,
    notificationService: NotificationService,
    upsertSignatureRequest: UpsertSignatureRequest,
    createAndSendAnalyticsEvent: CreateAndSendAnalyticsEvent
  ) =>
  ({ signatureRequest }: { signatureRequest: SignatureRequest }) => {
    const sendRequestToSignNotification = (req: SignatureRequest) =>
      sendSignatureRequestNotification(requestToSignMessage)(req)({
        signerRepository,
        notificationService
      });
    return pipe(
      sequenceS(TE.ApplySeq)({
        signatureRequest: pipe(
          signatureRequest,
          validate(
            SignatureRequestReadyToNotify,
            "Notification can only be sent if the signature request is WAIT_FOR_SIGNATURE and it has not already been sent!"
          ),
          TE.fromEither
        ),
        notification: pipe(
          signatureRequest,
          sendRequestToSignNotification,
          TE.fold(
            (error): T.Task<SendNotificationResult> =>
              T.of({ sent: false, error }),
            (notification): T.Task<SendNotificationResult> =>
              T.of({ sent: true, notification })
          ),
          TE.fromTask,
          TE.chainFirstW((result) =>
            pipe(
              signatureRequest,
              createAndSendAnalyticsEvent(
                result.sent
                  ? EventName.NOTIFICATION_SENT
                  : EventName.NOTIFICATION_REJECTED
              )
            )
          ),
          TE.chain((result) =>
            result.sent ? TE.right(result.notification) : TE.left(result.error)
          )
        )
      }),
      TE.chainFirst(({ signatureRequest, notification }) =>
        pipe(
          {
            ...signatureRequest,
            notification
          },
          upsertSignatureRequest
        )
      ),
      TE.map(({ notification }) => notification)
    );
  };
