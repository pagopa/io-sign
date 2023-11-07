import { Agent, RequestInfo } from "undici";
import {
  AbortableFetch,
  toFetch,
  setFetchTimeout,
} from "@pagopa/ts-commons/lib/fetch";
import { Millisecond } from "@pagopa/ts-commons/lib/units";

const fetchAgentKeepAlive = (
  info: RequestInfo,
  init?: RequestInit | undefined
) =>
  fetch(info, {
    ...init,
    dispatcher: new Agent({
      keepAliveTimeout: 10,
      keepAliveMaxTimeout: 10,
    }),
  });

const abortableFetch = AbortableFetch(fetchAgentKeepAlive);

export const fetchWithTimeout = toFetch(
  setFetchTimeout(8000 as Millisecond, abortableFetch)
);
