import { agent } from "@pagopa/ts-commons";

import {
  AbortableFetch,
  setFetchTimeout,
  toFetch,
} from "@pagopa/ts-commons/lib/fetch";

import { Millisecond } from "@pagopa/ts-commons/lib/units";

import { createClient, Client } from "@pagopa/io-functions-services-sdk/client";

import { NewMessage } from "@pagopa/io-functions-services-sdk/NewMessage";

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

const httpApiFetch = agent.getHttpFetch(process.env);
const abortableFetch = AbortableFetch(httpApiFetch);

type IOApiClient = Client<"SubscriptionKey">;

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

export const makeSubmitMessageForUser =
  (ioApiClient: IOApiClient) => (message: NewMessageWithFiscalCode) =>
    TE.tryCatch(
      () =>
        ioApiClient.submitMessageforUserWithFiscalCodeInBody({
          message,
        }),
      E.toError
    );
