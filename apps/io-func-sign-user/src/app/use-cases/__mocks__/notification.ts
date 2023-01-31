import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { GetFiscalCodeBySignerId } from "@io-sign/io-sign/signer";

import {
  SubmitNotificationForUser,
  withFiscalCode,
} from "@io-sign/io-sign/notification";

import { sequenceS } from "fp-ts/lib/Apply";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { SignatureRequest } from "../../../signature-request";

// TODO: this is a mock
const mockSuccessMessage = (signatureRequest: SignatureRequest) => ({
  content: {
    subject: `${signatureRequest.issuerDescription} - Documenti firmati`,
    markdown: `---\nit:\n    cta_1: \n        text: "Vedi documenti"\n        action: "ioit://FCI_MAIN?signatureRequestId=${signatureRequest.id}"\nen:\n    cta_1: \n        text: See documents"\n        action: "ioit://FCI_MAIN?signatureRequestId=${signatureRequest.id}"\n---\nI documenti che hai firmato sono pronti.\n\n\nHai **90** giorni dalla ricezione di questo messaggio per visualizzarli e salvarli sul tuo dispositivo.\n`,
  },
});

const mockErrorMessage = (signatureRequest: SignatureRequest) => ({
  content: {
    subject: `Errore firma`,
    markdown: `---\nit:\n    cta_1: \n        text: "Vedi documenti"\n        action: "ioit://FCI_MAIN?signatureRequestId=${signatureRequest.id}"\nen:\n    cta_1: \n        text: "See documents"\n        action: "ioit://FCI_MAIN?signatureRequestId=${signatureRequest.id}"\n---\nA causa di un problema tecnico, la firma non è andata a buon fine.\n\n\nVai ai documenti e firmali di nuovo. Se il problema si ripete, contatta l'assistenza.\n`,
  },
});

export type MockSendNotification = (
  signatureRequest: SignatureRequest
) => TE.TaskEither<
  Error,
  {
    ioMessageId: NonEmptyString;
  }
>;
export const makeMockSendNotification =
  (
    submitNotification: SubmitNotificationForUser,
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId
  ): MockSendNotification =>
  (signatureRequest: SignatureRequest) =>
    pipe(
      sequenceS(TE.ApplySeq)({
        notification: pipe(
          getFiscalCodeBySignerId(signatureRequest.signerId),
          TE.chain(
            TE.fromOption(
              () =>
                new EntityNotFoundError(
                  "The fiscal code associated with this signer is not valid!"
                )
            )
          ),
          TE.map((fiscalCode) =>
            pipe(
              signatureRequest.status === "SIGNED"
                ? mockSuccessMessage(signatureRequest)
                : mockErrorMessage(signatureRequest),
              withFiscalCode(fiscalCode)
            )
          ),
          TE.chain(submitNotification)
        ),
      }),
      TE.map(({ notification }) => notification)
    );
