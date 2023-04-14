import * as L from "@pagopa/logger";

// Derive a concrete implementation L.Logger using azure.Context.log
export const ConsoleLogger: L.Logger = {
  log: (s, level) => () => {
    const logFunc: Record<typeof level, (s: string) => void> = {
      // eslint-disable-next-line no-console
      debug: console.log,
      // eslint-disable-next-line no-console
      info: console.log,
      // eslint-disable-next-line no-console
      warn: console.warn,
      // eslint-disable-next-line no-console
      error: console.error,
      // eslint-disable-next-line no-console
      fatal: console.error,
    };
    logFunc[level](s);
  },
  format:
    process.env.NODE_ENV === "development" ? L.format.simple : L.format.json,
};
