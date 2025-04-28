import { EntityNotFoundError } from "@io-sign/io-sign/error";
import {
  NotificationMessage,
  SubmitNotificationForUser,
  submitNotification
} from "@io-sign/io-sign/notification";
import {
  GetFiscalCodeBySignerId,
  getFiscalCodeBySignerId
} from "@io-sign/io-sign/signer";
import { sequenceS } from "fp-ts/lib/Apply";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { constFalse, constTrue, pipe } from "fp-ts/lib/function";

import { Dossier, GetDossier } from "./dossier";
import { SignatureRequest } from "./signature-request";

/** @deprecated */
export interface SendNotificationPayload {
  signatureRequest: SignatureRequest;
}

/** @deprecated */
export type MakeMessageContent = (
  dossier: Dossier
) => (signatureRequest: SignatureRequest) => NotificationMessage;

/**
 * @deprecated use "sendSignatureRequestNotification" instead
 * Sends a signature request notification by constructing the message with makeMessageContent.
 */
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
                  "The fiscal code associated with this signer is not valid."
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
        )
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

// Sends a notification by constructing the message with buildNotificationMessage
export const sendSignatureRequestNotification =
  (
    buildNotificationMessage: (request: SignatureRequest) => NotificationMessage
  ) =>
  (request: SignatureRequest) =>
    pipe(
      getFiscalCodeBySignerId(request.signerId),
      RTE.chainW((fiscalCode) =>
        submitNotification(fiscalCode, buildNotificationMessage(request))
      ),
      RTE.bimap(constFalse, constTrue),
      RTE.toUnion
    );
