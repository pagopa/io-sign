import { describe, it, expect } from "vitest";

import {
  HttpBadRequestError,
  HttpError,
  HttpErrorFromError,
  HttpNotFoundError,
} from "../errors";
import * as E from "fp-ts/lib/Either";
import { identity, pipe } from "fp-ts/lib/function";
import { ActionNotAllowedError, EntityNotFoundError } from "../../../error";

describe.concurrent("errors", () => {
  describe("isHttpError", () => {
    it("should pass on a well-formed http error", () => {
      const error = new HttpError("I'm an error, but at least I'm well-formed");
      const plain = new Error("plain error");
      expect(HttpErrorFromError.is(error)).toBe(true);
      expect(HttpErrorFromError.is(plain)).toBe(false);
      expect(HttpErrorFromError.is({})).toBe(false);
      expect(HttpErrorFromError.is({ name: "HttpError" })).toBe(false);
    });
  });
  describe("HttpErrorFromError", () => {
    it("should pass when it's already an HttpError", () => {
      const error = new HttpError("Already an HttpError.");
      const isEqual = pipe(
        HttpErrorFromError.decode(error),
        E.map((e) => e === error),
        E.getOrElse(() => false)
      );
      expect(isEqual).toBe(true);
    });
    it("should parse an EntityNotFoundError as HttpNotFoundError", () => {
      const entityNotFound = new EntityNotFoundError(
        "The specified entity was not found"
      );
      const isHttpNotFoundError = pipe(
        HttpErrorFromError.decode(entityNotFound),
        E.mapLeft(() => false),
        E.filterOrElse(
          (e) => e.name === "HttpError",
          () => false
        ),
        E.filterOrElse(
          (e) => e.status === 404,
          () => false
        ),
        E.map(HttpErrorFromError.is),
        E.getOrElse(identity)
      );
      expect(isHttpNotFoundError).toBe(true);
    });
    it("should parse an ActionNotAllowedError as HttpBadRequest", () => {
      const actionNotAllowed = new ActionNotAllowedError("Action not allowed");
      const isHttpBadRequest = pipe(
        HttpErrorFromError.decode(actionNotAllowed),
        E.mapLeft(() => false),
        E.filterOrElse(
          (e) => e.name === "HttpError",
          () => false
        ),
        E.filterOrElse(
          (e) => e.status === 400,
          () => false
        ),
        E.map(HttpErrorFromError.is),
        E.getOrElse(identity)
      );
      expect(isHttpBadRequest).toBe(true);
    });
    it("should fail on unsupported error type", () => {
      const unexpected = new Error("Unexpected.");
      const unsupported = pipe(HttpErrorFromError.decode(unexpected), E.isLeft);
      expect(unsupported).toBe(true);
    });
  });
  describe("HttpNotFoundError", () => {
    it("has the 404 status code", () => {
      const e = new HttpNotFoundError();
      expect(e.status).toBe(404);
    });
  });
  describe("HttpBadRequestError", () => {
    it("has the 400 status code", () => {
      const e = new HttpBadRequestError();
      expect(e.status).toBe(400);
    });
  });
});
