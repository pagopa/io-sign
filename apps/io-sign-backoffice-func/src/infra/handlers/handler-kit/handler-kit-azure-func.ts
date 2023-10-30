import { pipe } from "fp-ts/lib/function";
import * as RE from "fp-ts/lib/ReaderEither";
import * as TE from "fp-ts/lib/TaskEither";
import { z } from "zod";
import * as L from "@pagopa/logger";
import { EventHubHandler, InvocationContext } from "@azure/functions";
import { sequenceS } from "fp-ts/lib/Apply";
import { Handler, isHandlerEnvironment } from "./handler";

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
    deps: Omit<R, "logger" | "input"> & { schema: z.ZodSchema<I> }
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
      TE.filterOrElse(
        isHandlerEnvironment<R, I>,
        () => new Error("Unmeet dependencies")
      ),
      TE.chainW(h)
    );

export const azureFunction: <I, A, R>(
  h: Handler<I, A, R>
) => (
  deps: Omit<R, "logger" | "input"> & { schema: z.ZodSchema<I> }
) => EventHubHandler = (h) => (deps) => (messages, ctx) =>
  pipe(azureFunctionTE(h, deps)(messages, ctx), TE.toUnion)();
