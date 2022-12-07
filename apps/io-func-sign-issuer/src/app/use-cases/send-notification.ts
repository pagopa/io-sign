import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as t from "io-ts";

import { GetFiscalCodeBySignerId } from "@io-sign/io-sign/signer";

import {
  SubmitMessageForUser,
  withFiscalCode,
} from "@io-sign/io-sign/infra/io-services/message";

import { validate } from "@io-sign/io-sign/validation";
import { sequenceS } from "fp-ts/lib/Apply";
import { EntityNotFoundError } from "@io-sign/io-sign/error";

import { SignatureRequestToBeSigned } from "@io-sign/io-sign/signature-request";
import {
  SignatureRequest,
  UpsertSignatureRequest,
} from "../../signature-request";

import { Dossier, GetDossier } from "../../dossier";

export type SendNotificationPayload = {
  signatureRequest: SignatureRequest;
};

// TODO: this is a mock
const mockMessage =
  (dossier: Dossier) => (signatureRequest: SignatureRequest) => ({
    content: {
      subject: `Richiesta di firma`,
      markdown: `---\n- SignatureRequestId: \`${
        signatureRequest.id
      }\`\n- n. documents: \`${
        signatureRequest.documents.length
      }\`\n- expiresAt: \`${
        signatureRequest.expiresAt ? signatureRequest.expiresAt : "never"
      }\`\n- dossier: \`${dossier.id}\`\n- docs: \`${JSON.stringify(
        signatureRequest.documents
      )}\`\n `,
    },
  });

const makeMessage =
  (getDossier: GetDossier) => (signatureRequest: SignatureRequest) =>
    pipe(
      sequenceS(TE.ApplySeq)({
        dossier: pipe(
          signatureRequest.issuerId,
          getDossier(signatureRequest.dossierId),
          TE.chain(TE.fromOption(() => new Error("Invalid dossier")))
        ),
      }),
      TE.chainW(({ dossier }) =>
        pipe(signatureRequest, mockMessage(dossier), TE.right)
      )
    );

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
    getDossier: GetDossier,
    upsertSignatureRequest: UpsertSignatureRequest
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
          getFiscalCodeBySignerId(signatureRequest.signerId),
          TE.chain(
            TE.fromOption(
              () =>
                new EntityNotFoundError(
                  "The tax code associated with this signer is not valid!"
                )
            )
          ),
          TE.chain((fiscalCode) =>
            pipe(
              signatureRequest,
              makeMessage(getDossier),
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
