import { Notification } from "@internal/io-sign/notification";

import { NewMessage } from "@pagopa/io-functions-services-sdk/NewMessage";

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { pipe, flow, identity } from "fp-ts/lib/function";
import { IOApiClient } from "./client";
import { makeRetriveUserProfileSenderAllowed } from "./profile";

export const newNewMessage = (
  subject: string,
  markdown: string
): NewMessage => ({
  content: {
    subject,
    markdown,
  },
});

type NewMessageWithFiscalCode = NewMessage & { fiscal_code: FiscalCode };

export const withFiscalCode =
  (fiscalCode: FiscalCode) =>
  (message: NewMessage): NewMessageWithFiscalCode => ({
    ...message,
    fiscal_code: fiscalCode,
  });

export type SubmitMessageForUser = (
  message: NewMessageWithFiscalCode
) => TE.TaskEither<Error, Notification>;

export const makeSubmitMessageForUser =
  (ioApiClient: IOApiClient): SubmitMessageForUser =>
  (message: NewMessageWithFiscalCode) =>
    pipe(
      message.fiscal_code,
      makeRetriveUserProfileSenderAllowed(ioApiClient),
      TE.filterOrElse(
        identity,
        () => new Error("It is not allowed to send a message to this user.")
      ),
      TE.chain(() =>
        TE.tryCatch(
          () =>
            ioApiClient.submitMessageforUserWithFiscalCodeInBody({
              message,
            }),
          E.toError
        )
      ),
      TE.chain(
        flow(
          E.mapLeft(() => new Error("Unable to send the message!")),
          E.chainW((response) =>
            response.status === 201
              ? E.right(response.value)
              : E.left(
                  new Error(`An error occurred while sending the message!`)
                )
          ),
          TE.fromEither
        )
      ),
      TE.map((createdMessage) => ({
        ioMessageId: createdMessage.id as NonEmptyString,
      }))
    );
