import { pipe, flow } from "fp-ts/lib/function";
import * as RE from "fp-ts/lib/ReaderEither";
import * as T from "fp-ts/lib/Task";

import * as TE from "fp-ts/lib/TaskEither";
import { z } from "zod";
import * as L from "@pagopa/logger";
import { EventHubHandler, InvocationContext } from "@azure/functions";
import { sequenceS } from "fp-ts/lib/Apply";
import { Handler } from "./handler";

// handler-kit-azure-func/logger.ts
// const getLogger = (ctx: InvocationContext): L.Logger => ({
//   log: (s, level) => () => {
//     const logFunc: Record<typeof level, (s: string) => void> = {
//       debug: ctx.debug,
//       info: ctx.info,
//       warn: ctx.warn,
//       error: ctx.error,
//       fatal: ctx.error,
//     };
//     logFunc[level](s);
//   },
//   format:
//     process.env.NODE_ENV === "development" ? L.format.simple : L.format.json,
// });

const getLogger = (ctx: InvocationContext): L.Logger => ({
  log: (s, _level) => () => {
    const level = _level === "fatal" ? "error" : _level;
    ctx[level](s);
  },
  format:
    process.env.NODE_ENV === "development" ? L.format.simple : L.format.json,
});

const azureFunctionTE =
  <I, A, R>(
    h: Handler<I, A, R>,
    deps: R & { schema: z.ZodSchema<I> } // deps: R -> deps: Omit<R, "logger" | "input">
  ) =>
  (messages: unknown, ctx: InvocationContext) =>
    pipe(
      ctx,
      sequenceS(RE.Apply)({
        logger: RE.fromReader(getLogger),
        input: RE.right(messages),
      }),
      TE.fromEither,
      TE.map(({ input, logger }) => ({ input, logger, ...deps })),
      TE.map((x) => {
        x.logger.log("foo!!! ", "info")(); // logga
        return x;
      }),
      TE.chainW((x) => {
        return h(x);
      })
      // TE.mapError((e) =>
      //   L.error("uncaught error from handler", { error: e })({
      //     logger: getLogger(ctx),
      //   })
      // )
    );

// il log dentro handler-kit sta qui
export const azureFunction: <I, A, R>(
  h: Handler<I, A, R>
) => (
  deps: R & { schema: z.ZodSchema<I> } // deps: R -> deps: Omit<R, "logger" | "input">
) => EventHubHandler = (h) => (deps) => (messages, ctx) => {
  // questa funzione può anche non ritornare niente o deve tornare per forza result?
  // const result = pipe(azureFunctionTE(h, deps)(messages, ctx))();
  console.log("mio");
  ctx.log("before foo"); // logga
  // azureFunctionTE(h, deps)(messages, ctx)();
  // ctx.log("after foo"); // logga
  const result = pipe(
    azureFunctionTE(h, deps)(messages, ctx),
    TE.mapError((x) => {
      console.log("sib ", x);
    }),
    TE.toUnion
  )();
  return result;
};
