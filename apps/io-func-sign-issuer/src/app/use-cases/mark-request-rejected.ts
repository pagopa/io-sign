import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { SubmitNotificationForUser } from "@io-sign/io-sign/notification";
import { SignatureRequestRejected } from "@io-sign/io-sign/signature-request";
import { GetFiscalCodeBySignerId } from "@io-sign/io-sign/signer";
import { NotificationContent } from "@io-sign/io-sign/notification";

import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";
import { CreateAndSendAnalyticsEvent, EventName } from "@io-sign/io-sign/event";
import { Dossier, GetDossier } from "../../dossier";

import {
  UpsertSignatureRequest,
  markAsRejected,
  GetSignatureRequest,
  SignatureRequest,
} from "../../signature-request";
import {
  MakeMessageContent,
  makeSendSignatureRequestNotification,
} from "../../signature-request-notification";

const rejectedMessage: MakeMessageContent =
  (dossier: Dossier) =>
  (signatureRequest: SignatureRequest): NotificationContent => ({
    subject: `${signatureRequest.issuerDescription} - ${dossier.title} - C'è un problema con la firma`,
    markdown: `A causa di un problema tecnico, la firma non è andata a buon fine.\n\n\nL’ente mittente ti contatterà nei prossimi giorni per farti firmare di nuovo. Se ciò non dovesse succedere, scrivi a [${signatureRequest.issuerEmail}](mailto:${signatureRequest.issuerEmail}).`,
  });

export const makeMarkRequestAsRejected =
  (
    getDossier: GetDossier,
    getSignatureRequest: GetSignatureRequest,
    upsertSignatureRequest: UpsertSignatureRequest,
    submitNotification: SubmitNotificationForUser,
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId,
    createAndSendAnalyticsEvent: CreateAndSendAnalyticsEvent,
  ) =>
  (request: SignatureRequestRejected) => {
    const sendRejectedNotification = makeSendSignatureRequestNotification(
      submitNotification,
      getFiscalCodeBySignerId,
      getDossier,
      rejectedMessage,
    );

    return pipe(
      pipe(request.issuerId, getSignatureRequest(request.id)),
      TE.chain(
        TE.fromOption(
          () => new EntityNotFoundError("Signature Request not found."),
        ),
      ),
      TE.chainEitherK(markAsRejected(request.rejectedAt, request.rejectReason)),
      TE.chain(upsertSignatureRequest),
      TE.chainW(() =>
        pipe(
          request,
          sendRejectedNotification,
          // This is a fire-and-forget operation
          TE.altW(() => TE.right(request)),
        ),
      ),
      TE.chainFirstW(() =>
        pipe(
          request,
          createAndSendAnalyticsEvent(EventName.SIGNATURE_REJECTED),
        ),
      ),
    );
  };
