import { Client, createClient } from "@pagopa/io-functions-services-sdk/client";
import { agent } from "@pagopa/ts-commons";
import {
  AbortableFetch,
  setFetchTimeout,
  toFetch
} from "@pagopa/ts-commons/lib/fetch";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Millisecond } from "@pagopa/ts-commons/lib/units";

const httpApiFetch = agent.getHttpFetch(process.env);
const abortableFetch = AbortableFetch(httpApiFetch);

export interface IOApiClient {
  client: Client<"SubscriptionKey">;
  baseUrl: NonEmptyString;
}

export const createIOApiClient = (
  baseUrl: string,
  subscriptionKey: string,
  timeout = 1000 as Millisecond
): IOApiClient => ({
  client: createClient<"SubscriptionKey">({
    baseUrl,
    fetchApi: toFetch(
      setFetchTimeout(timeout, abortableFetch)
    ) as unknown as typeof fetch,
    withDefaults: (op) => (params) =>
      op({
        ...params,
        SubscriptionKey: subscriptionKey
      })
  }),
  baseUrl: baseUrl as NonEmptyString
});
