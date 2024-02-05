import { EntityNotFoundError } from "@io-sign/io-sign/error";
import {
  CreateAndSendAnalyticsEvent,
  createBillingEvent,
  EventName,
  SendEvent,
} from "@io-sign/io-sign/event";
import { SubmitNotificationForUser } from "@io-sign/io-sign/notification";

import { SignatureRequestSigned } from "@io-sign/io-sign/signature-request";
import { GetFiscalCodeBySignerId } from "@io-sign/io-sign/signer";

import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";
import { NotificationContentWithAttachments } from "@io-sign/io-sign/notification";
import { sequenceS } from "fp-ts/lib/Apply";
import { Dossier, GetDossier } from "../../dossier";

import {
  UpsertSignatureRequest,
  markAsSigned,
  GetSignatureRequest,
  SignatureRequest,
} from "../../signature-request";
import {
  MakeMessageContent,
  makeSendSignatureRequestNotification,
} from "../../signature-request-notification";

const signedMessage: MakeMessageContent =
  (dossier: Dossier) =>
  (signatureRequest: SignatureRequest): NotificationContentWithAttachments => ({
    subject: `${signatureRequest.issuerDescription} - ${dossier.title} - Documenti firmati`,
    markdown: `I documenti che hai firmato sono pronti!\n\n\nHai **90 giorni** dalla ricezione di questo messaggio per visualizzarli e salvarli sul tuo dispositivo.\n\n\nSe hai dei problemi che riguardano il contenuto del documento, scrivi a [${signatureRequest.issuerEmail}](mailto:${signatureRequest.issuerEmail}).`,
    signatureRequestId: signatureRequest.id,
  });

export const makeMarkRequestAsSigned =
  (
    getDossier: GetDossier,
    getSignatureRequest: GetSignatureRequest,
    upsertSignatureRequest: UpsertSignatureRequest,
    submitNotification: SubmitNotificationForUser,
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId,
    sendBillingEvent: SendEvent,
    createAndSendAnalyticsEvent: CreateAndSendAnalyticsEvent,
  ) =>
  (request: SignatureRequestSigned) => {
    const sendSignedNotification = makeSendSignatureRequestNotification(
      submitNotification,
      getFiscalCodeBySignerId,
      getDossier,
      signedMessage,
    );
    return pipe(
      sequenceS(TE.ApplicativeSeq)({
        signatureRequest: pipe(
          request.issuerId,
          getSignatureRequest(request.id),
          TE.chain(
            TE.fromOption(
              () => new EntityNotFoundError("Signature Request not found."),
            ),
          ),
        ),
      }),
      TE.chain(({ signatureRequest }) =>
        pipe(
          signatureRequest,
          markAsSigned,
          TE.fromEither,
          TE.chain(upsertSignatureRequest),
          TE.chainW(() =>
            pipe(
              request,
              sendSignedNotification,
              // This is a fire-and-forget operation
              TE.altW(() => TE.right(request)),
            ),
          ),
          TE.chain(() => pipe(request, createBillingEvent, sendBillingEvent)),
          TE.chainFirstW(() =>
            pipe(
              request,
              createAndSendAnalyticsEvent(EventName.SIGNATURE_SIGNED),
            ),
          ),
        ),
      ),
    );
  };
