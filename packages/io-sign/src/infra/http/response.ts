import {
  response,
  withStatusCode,
  withHeader,
  serializeToJSON,
} from "@pagopa/handler-kit/lib/http";

import { validate } from "../../validation";

import { pipe, flow } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";

import * as t from "io-ts";

import { HttpError, HttpErrorFromError } from "./errors";

import { toProblemDetail } from "./problem-detail";

const serializationProblem = pipe(
  new HttpError("Unable to serialize the response."),
  toProblemDetail,
  JSON.stringify,
  response,
  withStatusCode(500),
  withHeader("Content-Type", "application/problem+json")
);

const jsonResponse =
  (statusCode: number) =>
  <T>(schema: t.Decoder<unknown, T>) =>
    flow(
      validate(schema, "Unable to validate the success response."),
      E.map(flow(response, withStatusCode(statusCode))),
      E.chainW(serializeToJSON),
      E.getOrElse(() => serializationProblem)
    );

export const success = jsonResponse(200);
export const created = jsonResponse(201);

export const error = (e: Error) =>
  pipe(
    HttpErrorFromError.decode(e),
    E.orElse(() => E.right(e)),
    E.map(toProblemDetail),
    E.map((problem) => response(problem)),
    E.map((res) => pipe(res, withStatusCode(res.body.status))),
    E.chainW(serializeToJSON),
    E.map(withHeader("Content-Type", "application/problem+json")),
    E.getOrElse(() => serializationProblem)
  );
