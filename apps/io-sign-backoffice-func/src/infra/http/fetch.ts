import { Agent, RequestInfo } from "undici";

export const fetchWithTimeoutAndKeepAlive = (
  info: RequestInfo,
  init?: RequestInit | undefined
) =>
  fetch(info, {
    ...init,
    dispatcher: new Agent({
      keepAliveTimeout: 60000,
      keepAliveMaxTimeout: 60000,
      headersTimeout: 8000,
      bodyTimeout: 8000,
    }),
  });
