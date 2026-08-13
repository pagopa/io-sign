import { agent } from "@pagopa/ts-commons";

import {
  AbortableFetch,
  setFetchTimeout,
  toFetch
} from "@pagopa/ts-commons/lib/fetch";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Millisecond } from "@pagopa/ts-commons/lib/units";

import { Client, createClient } from "./models/client";

const httpApiFetch = agent.getHttpFetch(process.env);
const abortableFetch = AbortableFetch(httpApiFetch);

export type IoProfileClient = Client<"SubscriptionKey">;

export type IoProfileClientWithApiKey = {
  client: IoProfileClient;
  apiKey: NonEmptyString;
  baseUrl: NonEmptyString;
};

export const createIoProfileClient = (
  baseUrl: string,
  apiKey: string,
  timeout = 3000 as Millisecond
): IoProfileClientWithApiKey => ({
  client: createClient<"SubscriptionKey">({
    baseUrl,
    fetchApi: toFetch(
      setFetchTimeout(timeout, abortableFetch)
    ) as unknown as typeof fetch,
    withDefaults: (op) => (params) =>
      op({
        ...params,
        SubscriptionKey: apiKey
      })
  }),
  apiKey: apiKey as NonEmptyString,
  baseUrl: baseUrl as NonEmptyString
});
