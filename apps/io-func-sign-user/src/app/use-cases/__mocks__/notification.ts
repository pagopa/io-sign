import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { GetFiscalCodeBySignerId } from "@io-sign/io-sign/signer";

import {
  SubmitMessageForUser,
  withFiscalCode,
} from "@io-sign/io-sign/infra/io-services/message";
import { sequenceS } from "fp-ts/lib/Apply";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { SignatureRequest } from "../../../signature-request";

// TODO: this is a mock
const mockSuccessMessage = (signatureRequest: SignatureRequest) => ({
  content: {
    subject: `Firma emessa con successo`,
    markdown: `---\n- SignatureRequestId: \`${
      signatureRequest.id
    }\`\n- n. documents: \`${
      signatureRequest.documents.length
    }\`\n- expiresAt: \`${
      signatureRequest.expiresAt ? signatureRequest.expiresAt : "never"
    }}\`\n `,
  },
});

// TODO: this is a mock
const mockErrorMessage = (signatureRequest: SignatureRequest) => ({
  content: {
    subject: `Firma non emessa`,
    markdown: `---\n- SignatureRequestId: \`${
      signatureRequest.id
    }\`\n- n. documents: \`${
      signatureRequest.documents.length
    }\`\n- expiresAt: \`${
      signatureRequest.expiresAt ? signatureRequest.expiresAt : "never"
    }}\`\n `,
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
    submitMessage: SubmitMessageForUser,
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
          TE.chain(submitMessage)
        ),
      }),
      TE.map(({ notification }) => notification)
    );
