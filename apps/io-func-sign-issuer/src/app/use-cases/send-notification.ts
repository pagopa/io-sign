import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { GetFiscalCodeBySignerId } from "@internal/io-sign/signer";
import {
  SubmitMessageForUser,
  withFiscalCode,
} from "@internal/io-services/client";
import { SignatureRequest } from "../../signature-request";

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
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId
  ) =>
  ({ signatureRequest }: SendNotificationPayload) =>
    pipe(
      signatureRequest.signerId,
      getFiscalCodeBySignerId,
      TE.chain(TE.fromOption(() => new Error("Invalid fiscal code"))),
      TE.map((fiscalCode) =>
        pipe(signatureRequest, mockMakeMessage, withFiscalCode(fiscalCode))
      ),
      TE.chain(submitMessage)
    );
