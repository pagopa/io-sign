import { identity } from "fp-ts/lib/function";

import * as t from "io-ts";

export class HttpError extends Error {
  name = "HttpError";
  status = 500;
  title = "Internal Server Error";
}

const isHttpError = (u: unknown): u is HttpError =>
  u instanceof HttpError &&
  u.name === "HttpError" &&
  typeof u.status === "number" &&
  Number.isInteger(u.status);

export class HttpNotFoundError extends HttpError {
  status = 404;
  title = "Not Found";
}

export class HttpBadRequestError extends HttpError {
  status = 400;
  title = "Bad Request";
}

export const HttpErrorFromError = new t.Type<HttpError, Error, Error>(
  "HttpErrorFromError",
  isHttpError,
  (e, ctx) => {
    if (isHttpError(e)) {
      return t.success(e);
    }
    switch (e.name) {
      case "EntityNotFoundError":
        return t.success(new HttpNotFoundError(e.message));
      case "ActionNotAllowedError":
        return t.success(new HttpBadRequestError(e.message));
      case "InvalidExpiryDateError":
        return t.success(new HttpBadRequestError(e.message));
    }
    return t.failure(e, ctx, "Unsupported error type.");
  },
  identity
);
