import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as t from "io-ts";

import { GetFiscalCodeBySignerId } from "@io-sign/io-sign/signer";
import { format } from "date-fns";

import {
  SubmitMessageForUser,
  withFiscalCode,
} from "@io-sign/io-sign/infra/io-services/message";

import { validate } from "@io-sign/io-sign/validation";
import { sequenceS } from "fp-ts/lib/Apply";
import { EntityNotFoundError } from "@io-sign/io-sign/error";

import { SignatureRequestToBeSigned } from "@io-sign/io-sign/signature-request";
import { Issuer } from "@io-sign/io-sign/issuer";
import {
  SignatureRequest,
  UpsertSignatureRequest,
} from "../../signature-request";

import { Dossier, GetDossier } from "../../dossier";

export type SendNotificationPayload = {
  signatureRequest: SignatureRequest;
  issuer: Issuer;
};

// TODO: this is a mock
const mockMessage =
  (issuer: Issuer, dossier: Dossier) =>
  (signatureRequest: SignatureRequest) => ({
    content: {
      subject: `${issuer.description} - ${dossier.title} - Firma`,
      markdown: `---\nit:\n    cta_1: \n        text: "Vedi documenti"\n        action: "ioit://FCI_MAIN?signatureRequestId=${
        signatureRequest.id
      }"\nen:\n    cta_1: \n        text: "See documents"\n        action: "ioit://FCI_MAIN?signatureRequestId=${
        signatureRequest.id
      }"\n---\nL'ente ${
        issuer.description
      } ha **richiesto la tua firma** su alcuni documenti relativi a ${
        dossier.title
      }.\n\n\nHai tempo fino al ${format(
        signatureRequest.expiresAt,
        "dd/MM/yyyy"
      )} per firmare: ti basta confermare l'operazione con il **codice di sblocco** dell'app o con il tuo **riconoscimento biometrico**.`,
    },
  });

const makeMessage =
  (issuer: Issuer, dossier: Dossier) => (signatureRequest: SignatureRequest) =>
    pipe(signatureRequest, mockMessage(issuer, dossier), TE.right);

const SignatureRequestReadyToNotify = t.intersection([
  SignatureRequestToBeSigned,
  t.type({
    dossierId: Dossier.props.id,
    notication: t.undefined,
  }),
]);

export const makeSendNotification =
  (
    submitMessage: SubmitMessageForUser,
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId,
    upsertSignatureRequest: UpsertSignatureRequest,
    getDossier: GetDossier
  ) =>
  ({ signatureRequest, issuer }: SendNotificationPayload) =>
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
              issuer.id,
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
              makeMessage(issuer, dossier),
              TE.map(withFiscalCode(fiscalCode))
            )
          ),
          TE.chain(submitMessage)
        ),
      }),
      TE.chainFirst(({ signatureRequest }) =>
        upsertSignatureRequest(signatureRequest)
      ),
      TE.map(({ notification }) => notification)
    );
