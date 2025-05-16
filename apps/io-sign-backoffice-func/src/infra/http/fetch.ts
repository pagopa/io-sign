import { Agent } from "undici";

export const dispatcher = new Agent({
  keepAliveTimeout: 10000,
  keepAliveMaxTimeout: 10000,
  headersTimeout: 8000,
  bodyTimeout: 8000,
});
