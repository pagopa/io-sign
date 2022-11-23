import { agent } from "@pagopa/ts-commons";

import {
  AbortableFetch,
  setFetchTimeout,
  toFetch,
} from "@pagopa/ts-commons/lib/fetch";

import { Millisecond } from "@pagopa/ts-commons/lib/units";

import { createClient, Client } from "@pagopa/io-functions-services-sdk/client";

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
