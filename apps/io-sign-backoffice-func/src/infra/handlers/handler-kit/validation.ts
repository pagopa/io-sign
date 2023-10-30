import * as E from "fp-ts/lib/Either";
import { z } from "zod";

export const parse =
  <T>(a: z.ZodSchema<T>) =>
  (i: unknown): E.Either<z.ZodError, T> => {
    try {
      const dataParsed = a.parse(i);
      return E.right(dataParsed);
    } catch (e) {
      return e instanceof z.ZodError ? E.left(e) : E.left(new z.ZodError([]));
    }
  };
