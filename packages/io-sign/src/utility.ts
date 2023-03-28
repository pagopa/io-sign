import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

export const stringToBase64Encode = (arrayBuffer: string) =>
  pipe(
    E.tryCatch(
      () => Buffer.from(arrayBuffer, "utf-8").toString("base64"),
      E.toError
    ),
    E.chainW(E.fromNullable(new Error("Unable to convert string to base64")))
  );

export const stringFromBase64Encode = (arrayBuffer: string) =>
  pipe(
    E.tryCatch(
      () => Buffer.from(arrayBuffer, "base64").toString("utf-8"),
      E.toError
    ),
    E.chainW(
      E.fromNullable(new Error("Unable to convert base64 string to utf-8"))
    )
  );
