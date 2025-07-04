import * as H from "@pagopa/handler-kit";
import { errorRTE } from "@pagopa/logger";

import * as RTE from "fp-ts/ReaderTaskEither";

import { flow } from "fp-ts/function";

// Encode domain errors to http errors
const toHttpError = (e: Error): Error => {
  if (e.name === "HttpError") {
    return e;
  }
  switch (e.name) {
    case "EntityNotFoundError":
      return new H.HttpNotFoundError(e.message);
    case "ActionNotAllowedError":
      return new H.HttpBadRequestError(e.message);
    case "InvalidExpireDateError":
      return new H.HttpBadRequestError(e.message);
    case "TooManyRequestsError":
      return new H.HttpTooManyRequestsError(e.message);
  }
  return e;
};

// Right now we can't use H.toProblemJson from @pagopa/handler-kit
// due to a compatibility problem with Node and TypeScript
// so we have our custom implementation
// will be fixed by SFEQS-1379

const isValidationError = (e: Error): e is H.ValidationError =>
  e.name === "ValidationError";

const isHttpError = (e: Error): e is H.HttpError => e.name === "HttpError";

export const toProblemJson = (e: Error): H.ProblemJson => {
  if (isValidationError(e)) {
    return {
      type: "/problem/validation-error",
      title: "Validation Error",
      detail: "Your request didn't validate",
      status: 422,
      violations: e.violations
    };
  }

  if (isHttpError(e)) {
    return {
      title: e.title,
      status: e.status,
      detail: e.message
    };
  }
  return {
    title: "Internal Server Error",
    detail: e.name,
    status: 500
  };
};

export const toErrorResponse = flow(toHttpError, toProblemJson, H.problemJson);

export const logErrorAndReturnResponse = flow(
  RTE.right<object, Error, Error>,
  RTE.chainFirst((error) =>
    errorRTE("returning with an error response", { error })
  ),
  RTE.map(toErrorResponse)
);
