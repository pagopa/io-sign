import * as t from "io-ts";
import { z } from "zod";
import * as E from "fp-ts/lib/Either";

export const IoTsType = <T>(schema: z.ZodSchema<T>) =>
  new t.Type<z.infer<typeof schema>>(
    "FromZodSchemaCodec",
    (u): u is z.infer<typeof schema> => schema.safeParse(u).success,
    (u, ctx) => {
      const result = schema.safeParse(u);
      return result.success ? t.success(result.data) : t.failure(u, ctx);
    },
    (c) => c
  );

// an `fp-ts` version of zod safeParse
export const safeParse =
  <T>(schema: z.ZodSchema<T>) =>
  (i: unknown): E.Either<z.ZodError, T> => {
    const result = schema.safeParse(i);
    return result.success ? E.right(result.data) : E.left(result.error);
  };
