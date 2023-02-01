import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { SubmitNotificationForUser } from "@io-sign/io-sign/notification";
import { SignatureRequestRejected } from "@io-sign/io-sign/signature-request";
import { GetFiscalCodeBySignerId } from "@io-sign/io-sign/signer";
import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";
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
  (dossier: Dossier) => (signatureRequest: SignatureRequest) => ({
    content: {
      subject: `${signatureRequest.issuerDescription} - ${dossier.title} - Errore firma`,
      markdown: `---\nit:\n    cta_1: \n        text: "Vedi documenti"\n        action: "ioit://FCI_MAIN?signatureRequestId=${signatureRequest.id}"\nen:\n    cta_1: \n        text: "See documents"\n        action: "ioit://FCI_MAIN?signatureRequestId=${signatureRequest.id}"\n---\nA causa di un problema tecnico, la firma non è andata a buon fine.\n\n\nVai ai documenti e firmali di nuovo. Se il problema si ripete, contatta l'assistenza.\n`,
    },
  });

export const makeMarkRequestAsRejected =
  (
    getDossier: GetDossier,
    getSignatureRequest: GetSignatureRequest,
    upsertSignatureRequest: UpsertSignatureRequest,
    submitNotification: SubmitNotificationForUser,
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId
  ) =>
  (request: SignatureRequestRejected) => {
    const sendRejectedNotification = makeSendSignatureRequestNotification(
      submitNotification,
      getFiscalCodeBySignerId,
      getDossier,
      rejectedMessage
    );

    return pipe(
      pipe(request.issuerId, getSignatureRequest(request.id)),
      TE.chain(
        TE.fromOption(
          () => new EntityNotFoundError("Signature Request not found.")
        )
      ),
      TE.chainEitherK(markAsRejected(request.rejectedAt, request.rejectReason)),
      TE.chain(upsertSignatureRequest),
      TE.chainW(() =>
        pipe(
          request,
          sendRejectedNotification,
          // Sending the notification might fail, but I still want to be able to terminate the pipe.
          TE.altW(() => TE.right(request))
        )
      )
    );
  };
