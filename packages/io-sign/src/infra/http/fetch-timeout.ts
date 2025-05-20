import { agent } from "@pagopa/ts-commons";

import {
  AbortableFetch,
  setFetchTimeout,
  toFetch
} from "@pagopa/ts-commons/lib/fetch";

import { Millisecond } from "@pagopa/ts-commons/lib/units";

export const makeFetchWithTimeout = (
  timeout: Millisecond = 10000 as Millisecond,
  env: NodeJS.ProcessEnv = process.env
) => {
  const httpApiFetch = agent.getHttpFetch(env);
  const abortableFetch = AbortableFetch(httpApiFetch);
  return toFetch(
    setFetchTimeout(timeout, abortableFetch)
  ) as unknown as typeof fetch;
};
