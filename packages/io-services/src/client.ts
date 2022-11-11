import { agent } from "@pagopa/ts-commons";
import { Notification } from "@internal/io-sign/notification";
import {
  AbortableFetch,
  setFetchTimeout,
  toFetch,
} from "@pagopa/ts-commons/lib/fetch";

import { Millisecond } from "@pagopa/ts-commons/lib/units";

import { createClient, Client } from "@pagopa/io-functions-services-sdk/client";
import { CreatedMessage } from "@pagopa/io-functions-services-sdk/CreatedMessage";
import { NewMessage } from "@pagopa/io-functions-services-sdk/NewMessage";
import { validate } from "@pagopa/handler-kit/lib/validation";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { pipe } from "fp-ts/lib/function";

const httpApiFetch = agent.getHttpFetch(process.env);
const abortableFetch = AbortableFetch(httpApiFetch);

export type IOApiClient = Client<"SubscriptionKey">;

export const createIOApiClient = (
  baseUrl: string,
  subscriptionKey: string,
  timeout = 1000 as Millisecond
): IOApiClient =>
  createClient<"SubscriptionKey">({
    baseUrl,
    fetchApi: toFetch(
      setFetchTimeout(timeout, abortableFetch)
    ) as unknown as typeof fetch,
    withDefaults: (op) => (params) =>
      op({
        ...params,
        SubscriptionKey: subscriptionKey,
      }),
  });

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
      TE.tryCatch(
        () =>
          ioApiClient.submitMessageforUserWithFiscalCodeInBody({
            message,
          }),
        E.toError
      ),
      TE.chain((createdMessage) =>
        pipe(
          createdMessage,
          E.map((response) => response.value),
          E.chainW(
            validate(
              CreatedMessage,
              "An error occurred while validating the response"
            )
          ),
          E.mapLeft(() => new Error("Unable to send the message")),
          TE.fromEither
        )
      ),
      TE.map((createdMessage) => ({
        ioMessageId: createdMessage.id as NonEmptyString,
      }))
    );
