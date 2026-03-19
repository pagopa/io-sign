import { InvocationContext } from "@azure/functions";
import * as L from "@pagopa/logger";

export const makeLogger = (context: InvocationContext): L.Logger => ({
  log: (s, level) => () => {
    if (level === "debug") context.debug(s);
    else if (level === "info") context.info(s);
    else if (level === "warn") context.warn(s);
    else context.error(s);
  },
  format:
    process.env.NODE_ENV === "development" ? L.format.simple : L.format.json,
  context: {
    invocationId: context.invocationId,
    functionName: context.functionName
  }
});
