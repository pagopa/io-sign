import * as L from "@pagopa/logger";

// Derive a concrete implementation L.Logger using azure.Context.log
export const ConsoleLogger: L.Logger = {
  log: (s, level) => () => {
    const logFunc: Record<typeof level, (s: string) => void> = {
      debug: console.log,

      info: console.log,

      warn: console.warn,

      error: console.error,

      fatal: console.error
    };
    logFunc[level](s);
  },
  format:
    process.env.NODE_ENV === "development" ? L.format.simple : L.format.json
};
