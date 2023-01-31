import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { GetFiscalCodeBySignerId } from "@io-sign/io-sign/signer";

import {
  NotificationMessage,
  SubmitNotificationForUser,
} from "@io-sign/io-sign/notification";

import { sequenceS } from "fp-ts/lib/Apply";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { SignatureRequest } from "./signature-request";
import { Dossier, GetDossier } from "./dossier";

export type SendNotificationPayload = {
  signatureRequest: SignatureRequest;
};

export type MakeMessageContent = (
  dossier: Dossier
) => (signatureRequest: SignatureRequest) => NotificationMessage;

// Sends a signature request notification by constructing the message with makeMessageContent.
export const makeSendSignatureRequestNotification =
  (
    submitNotification: SubmitNotificationForUser,
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId,
    getDossier: GetDossier,
    makeMessageContent: MakeMessageContent
  ) =>
  (signatureRequest: SignatureRequest) =>
    pipe(
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
            TE.fromOption(() => new EntityNotFoundError("Dossier not found!"))
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
    );
