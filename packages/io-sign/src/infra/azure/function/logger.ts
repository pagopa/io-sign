import * as azure from "@azure/functions";
import * as L from "@pagopa/logger";

// Derive a concrete implementation L.Logger using azure.Context.log
export const getLogger = (ctx: azure.Context): L.Logger => ({
  log: (s, level) => () => {
    const logFunc: Record<typeof level, (s: string) => void> = {
      debug: ctx.log.verbose,
      info: ctx.log.info,
      warn: ctx.log.warn,
      error: ctx.log.error,
      fatal: ctx.log.error,
    };
    logFunc[level](s);
  },
  format:
    process.env.NODE_ENV === "development" ? L.format.simple : L.format.json,
  context: {
    invocationId: ctx.invocationId,
    functionName: ctx.executionContext.functionName,
  },
});
