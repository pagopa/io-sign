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

export interface LollipopApiClient {
  client: Client<"ApiKeyAuth">;
  baseUrl: NonEmptyString;
}

export const createLollipopApiClient = (
  baseUrl: string,
  apiKey: string,
  timeout = 1000 as Millisecond
): LollipopApiClient => ({
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
