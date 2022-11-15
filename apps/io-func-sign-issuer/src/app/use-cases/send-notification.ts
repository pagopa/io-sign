import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { GetFiscalCodeBySignerId } from "@internal/io-sign/signer";
import { Notification } from "@internal/io-sign/notification";
import {
  SubmitMessageForUser,
  withFiscalCode,
} from "@internal/io-services/message";
import { validate } from "@internal/io-sign/validation";
import { sequenceS } from "fp-ts/lib/Apply";
import { ConflictError, EntityNotFoundError } from "@internal/io-sign/error";
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

export const makeSendNotification =
  (
    submitMessage: SubmitMessageForUser,
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId,
    upsertSignatureRequest: UpsertSignatureRequest,
    getDossier: GetDossier
  ) =>
  ({ signatureRequest }: SendNotificationPayload) =>
    pipe(
      signatureRequest.status,
      validate(
        t.literal("READY"),
        "Notification can only be sent if the signature request is READY!"
      ),
      TE.fromEither,
      TE.filterOrElse(
        () => signatureRequest.notification === undefined,
        () =>
          new ConflictError(
            "You cannot send a new notification if it has already been sent!"
          )
      ),
      TE.chain(() => getFiscalCodeBySignerId(signatureRequest.signerId)),
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
      TE.chain(submitMessage),
      TE.chain((notification) =>
        pipe(
          {
            ...signatureRequest,
            notification,
          },
          upsertSignatureRequest
        )
      ),
      TE.map(
        (signatureRequest) => signatureRequest.notification as Notification
      )
    );
