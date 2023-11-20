import { Agent, RequestInfo } from "undici";

export const fetchWithTimeoutAndKeepAlive = (
  info: RequestInfo,
  init?: RequestInit | undefined
) =>
  fetch(info, {
    ...init,
    dispatcher: new Agent({
      keepAliveTimeout: 10000,
      keepAliveMaxTimeout: 10000,
      headersTimeout: 8000,
      bodyTimeout: 8000,
    }),
  });
