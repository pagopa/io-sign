import { agent } from "@pagopa/ts-commons";

import {
  AbortableFetch,
  setFetchTimeout,
  toFetch
} from "@pagopa/ts-commons/lib/fetch";

import { Millisecond } from "@pagopa/ts-commons/lib/units";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Client, createClient } from "./models/client";
import type { LollipopApiClientInt } from "./lc-params";

const httpApiFetch = agent.getHttpFetch(process.env);
const abortableFetch = AbortableFetch(httpApiFetch);

export type LollipopApiClientExt = {
  client: Client<"ApiKeyAuth">;
  baseUrl: NonEmptyString;
};

export const createLollipopApiClientExt = (
  baseUrl: string,
  apiKey: string,
  timeout = 3000 as Millisecond
): LollipopApiClientExt => ({
  client: createClient<"ApiKeyAuth">({
    baseUrl,
    fetchApi: toFetch(
      setFetchTimeout(timeout, abortableFetch)
    ) as unknown as typeof fetch,
    withDefaults: (op) => (params) =>
      op({
        ...params,
        ApiKeyAuth: apiKey
      })
  }),
  baseUrl: baseUrl as NonEmptyString
});

export const createLollipopApiClientInt = (
  baseUrl: string,
  apiKey: string,
  timeout = 3000 as Millisecond
): LollipopApiClientInt => ({
  baseUrl: baseUrl as NonEmptyString,
  apiKey: apiKey as NonEmptyString,
  fetchApi: toFetch(
    setFetchTimeout(timeout, abortableFetch)
  ) as unknown as typeof fetch
});
