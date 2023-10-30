import { pipe } from "fp-ts/lib/function";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { z } from "zod";
import * as L from "@pagopa/logger";
import { parse } from "./validation";

type HandlerEnvironment<T> = {
  input: unknown;
  schema: z.ZodSchema<T>;
  logger: L.Logger;
};

export type Handler<I, A, R = object> = RTE.ReaderTaskEither<
  R & HandlerEnvironment<I>,
  Error,
  A
>;

export const of = <I, A, R = object>(
  endpoint: (input: I) => RTE.ReaderTaskEither<R, Error, A>
): Handler<I, A, R> =>
  pipe(
    RTE.ask<HandlerEnvironment<I>>(),
    RTE.flatMapEither(({ input, schema }) => pipe(input, parse(schema))),
    // RTE.tap((input) => L.debugRTE("input decoded", { input })),
    RTE.flatMap(endpoint)
    // RTE.mapError((error) => {
    //   // L.debugRTE("error error", { error });
    //   console.log("error errorr!!! ");
    //   return error;
    // })
  );
