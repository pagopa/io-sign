import * as t from "io-ts";
import { ValidationError } from "../../validation";
import { HttpError } from "./errors";

const HttpProblemDetail = t.intersection([
  t.type({
    title: t.string,
    status: t.number
  }),
  t.partial({
    detail: t.string
  })
]);

const ValidationProblemDetail = t.type({
  type: t.literal("/problems/validation-error"),
  title: t.string,
  detail: t.string,
  status: t.literal(422),
  violations: t.array(t.string)
});

export const ProblemDetail = t.union([
  HttpProblemDetail,
  ValidationProblemDetail
]);

export type ProblemDetail = t.TypeOf<typeof ProblemDetail>;

export const toProblemDetail = (e: Error): ProblemDetail => {
  if (e instanceof ValidationError) {
    return {
      type: "/problems/validation-error",
      title: e.title,
      detail: e.message,
      violations: e.violations,
      status: 422
    };
  }
  if (e instanceof HttpError) {
    return {
      title: e.title,
      status: e.status,
      detail: e.message
    };
  }
  return {
    title: "Something went wrong.",
    status: 500
  };
};
