import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { GetFiscalCodeBySignerId } from "@internal/io-sign/signer";
import { Notification } from "@internal/io-sign/notification";
import {
  SubmitMessageForUser,
  withFiscalCode,
} from "@internal/io-services/client";
import { validate } from "@pagopa/handler-kit/lib/validation";
import {
  SignatureRequest,
  UpsertSignatureRequest,
} from "../../signature-request";

export type SendNotificationPayload = {
  signatureRequest: SignatureRequest;
};

// TODO: this is a mock
const mockMakeMessage = (signatureRequest: SignatureRequest) => ({
  content: {
    subject: `Richiesta di firma`,
    markdown: `---\n- SignatureRequestId: \`${
      signatureRequest.id
    }\`\n- n. documents: \`${
      signatureRequest.documents.length
    }\`\n- expiresAt: \`${
      signatureRequest.expiresAt ? signatureRequest.expiresAt : "never"
    }\`\n- docs: \`${JSON.stringify(signatureRequest.documents)}\`\n `,
  },
});

export const makeSendNotification =
  (
    submitMessage: SubmitMessageForUser,
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId,
    upsertSignatureRequest: UpsertSignatureRequest
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
          new Error(
            "You cannot send a new notification if it has already been sent!"
          )
      ),
      TE.chain(() => getFiscalCodeBySignerId(signatureRequest.signerId)),
      TE.chain(
        TE.fromOption(
          () =>
            new Error("The tax code associated with this signer is not valid!")
        )
      ),
      TE.map((fiscalCode) =>
        pipe(signatureRequest, mockMakeMessage, withFiscalCode(fiscalCode))
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
