import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";
import * as t from "io-ts";

import { GetFiscalCodeBySignerId } from "@io-sign/io-sign/signer";
import { format } from "date-fns";

import { SubmitNotificationForUser } from "@io-sign/io-sign/notification";

import { validate } from "@io-sign/io-sign/validation";
import { sequenceS } from "fp-ts/lib/Apply";

import { makeSignatureRequestVariant } from "@io-sign/io-sign/signature-request";

import { DocumentReady } from "@io-sign/io-sign/document";
import { CreateAndSendAnalyticsEvent, EventName } from "@io-sign/io-sign/event";
import { Notification } from "@io-sign/io-sign/notification";
import {
  SignatureRequest,
  UpsertSignatureRequest,
} from "../../signature-request";

import { Dossier, GetDossier } from "../../dossier";

import {
  MakeMessageContent,
  makeSendSignatureRequestNotification,
  SendNotificationPayload,
} from "../../signature-request-notification";

const requestToSignMessage: MakeMessageContent =
  (dossier: Dossier) => (signatureRequest: SignatureRequest) => ({
    subject: `${signatureRequest.issuerDescription} - ${dossier.title} - Richiesta di firma`,
    markdown: `---\nit:\n    cta_1: \n        text: "Vedi documenti"\n        action: "ioit://FCI_MAIN?signatureRequestId=${
      signatureRequest.id
    }"\nen:\n    cta_1: \n        text: "See documents"\n        action: "ioit://FCI_MAIN?signatureRequestId=${
      signatureRequest.id
    }"\n---\nL'ente ${
      signatureRequest.issuerDescription
    } ha **richiesto la tua firma** su alcuni documenti relativi a ${
      dossier.title
    }.\n\n\nHai tempo fino al ${format(
      signatureRequest.expiresAt,
      "dd/MM/yyyy HH:mm"
    )} per firmare: ti basta confermare l'operazione con il **codice di sblocco** dell'app o con il tuo **riconoscimento biometrico**.\n\n\nSe hai dei problemi che riguardano il contenuto del documento, scrivi a [${
      signatureRequest.issuerEmail
    }](mailto:${signatureRequest.issuerEmail}).`,
  });

const SignatureRequestReadyToNotify = makeSignatureRequestVariant(
  "WAIT_FOR_SIGNATURE",
  t.type({
    qrCodeUrl: t.string,
    documents: t.array(DocumentReady),
    notification: t.undefined,
  })
);

type SendNotificationResult =
  | { sent: true; notification: Notification }
  | { sent: false; error: Error };

export const makeSendNotification =
  (
    submitNotification: SubmitNotificationForUser,
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId,
    upsertSignatureRequest: UpsertSignatureRequest,
    getDossier: GetDossier,
    createAndSendAnalyticsEvent: CreateAndSendAnalyticsEvent
  ) =>
  ({ signatureRequest }: SendNotificationPayload) => {
    const sendRequestToSignNotification = makeSendSignatureRequestNotification(
      submitNotification,
      getFiscalCodeBySignerId,
      getDossier,
      requestToSignMessage
    );
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
        ),
      }),
      TE.chainFirst(({ signatureRequest, notification }) =>
        pipe(
          {
            ...signatureRequest,
            notification,
          },
          upsertSignatureRequest
        )
      ),
      TE.map(({ notification }) => notification)
    );
  };
