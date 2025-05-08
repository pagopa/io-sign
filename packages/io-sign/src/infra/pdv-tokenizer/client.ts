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

export type PdvTokenizerClient = Client;

export interface PdvTokenizerClientWithApiKey {
  client: PdvTokenizerClient;
  apiKey: NonEmptyString;
  baseUrl: NonEmptyString;
}

export const createPdvTokenizerClient = (
  baseUrl: string,
  apiKey: string,
  timeout = 1000 as Millisecond
): PdvTokenizerClientWithApiKey => ({
  client: createClient({
    baseUrl,
    fetchApi: toFetch(
      setFetchTimeout(timeout, abortableFetch)
    ) as unknown as typeof fetch,
    basePath: "/tokenizer/v1/"
  }),
  apiKey: apiKey as NonEmptyString,
  baseUrl: baseUrl as NonEmptyString
});
