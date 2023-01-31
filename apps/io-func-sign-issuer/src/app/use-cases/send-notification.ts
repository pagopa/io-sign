import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as t from "io-ts";

import { GetFiscalCodeBySignerId } from "@io-sign/io-sign/signer";
import { format } from "date-fns";

import { SubmitNotificationForUser } from "@io-sign/io-sign/notification";

import { validate } from "@io-sign/io-sign/validation";
import { sequenceS } from "fp-ts/lib/Apply";
import { EntityNotFoundError } from "@io-sign/io-sign/error";

import { makeSignatureRequestVariant } from "@io-sign/io-sign/signature-request";

import { DocumentReady } from "@io-sign/io-sign/document";
import {
  SignatureRequest,
  UpsertSignatureRequest,
} from "../../signature-request";

import { Dossier, GetDossier } from "../../dossier";

export type SendNotificationPayload = {
  signatureRequest: SignatureRequest;
};

const makeMessageContent =
  (dossier: Dossier) => (signatureRequest: SignatureRequest) => ({
    content: {
      subject: `${signatureRequest.issuerDescription} - ${dossier.title} - Richiesta di Firma`,
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
        "dd/MM/yyyy"
      )} per firmare: ti basta confermare l'operazione con il **codice di sblocco** dell'app o con il tuo **riconoscimento biometrico**.`,
    },
  });

const SignatureRequestReadyToNotify = makeSignatureRequestVariant(
  "WAIT_FOR_SIGNATURE",
  t.type({
    qrCodeUrl: t.string,
    documents: t.array(DocumentReady),
    notification: t.undefined,
  })
);

export const makeSendNotification =
  (
    submitNotification: SubmitNotificationForUser,
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId,
    upsertSignatureRequest: UpsertSignatureRequest,
    getDossier: GetDossier
  ) =>
  ({ signatureRequest }: SendNotificationPayload) =>
    pipe(
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
          sequenceS(TE.ApplicativeSeq)({
            fiscalCode: pipe(
              getFiscalCodeBySignerId(signatureRequest.signerId),
              TE.chain(
                TE.fromOption(
                  () =>
                    new EntityNotFoundError(
                      "The fiscal code associated with this signer is not valid!"
                    )
                )
              )
            ),
            dossier: pipe(
              signatureRequest.issuerId,
              getDossier(signatureRequest.dossierId),
              TE.chain(
                TE.fromOption(
                  () => new EntityNotFoundError("Dossier not found!")
                )
              )
            ),
          }),

          TE.chainW(({ fiscalCode, dossier }) =>
            pipe(
              signatureRequest,
              makeMessageContent(dossier),
              TE.fromNullable(new Error("Invalid message content")),
              TE.chain(submitNotification(fiscalCode))
            )
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
