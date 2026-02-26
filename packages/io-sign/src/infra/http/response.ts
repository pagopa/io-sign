// This module contains abstractions on an older version of handler-kit,
// used by the "io-func-sign-issuer" and "io-func-sign-user" services.
// It can be removed when the entire workspace will be migrated to the
// stable version of handler-kit.
// tracked-by: SFEQS-1545

import {
  response,
  serializeToJSON,
  withHeader,
  withStatusCode
} from "handler-kit-legacy/lib/http";

import { flow, pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";

import * as t from "io-ts";

import * as L from "@pagopa/logger";
import { validate } from "../../validation";

import { ConsoleLogger } from "../console-logger";
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

export const error = (e: Error) => {
  // TODO: [SFEQS-1587] Here a side effect is introduced on a pure function to use logs on the legacy version of handler-kit
  L.error("Uncaught error from handler", { error: e })({
    logger: ConsoleLogger
  })();
  return pipe(
    HttpErrorFromError.decode(e),
    E.orElse(() => E.right(e)),
    E.map(
      flow(toProblemDetail, response, (res) =>
        pipe(res, withStatusCode(res.body.status))
      )
    ),
    E.chainW(serializeToJSON),
    E.map(withHeader("Content-Type", "application/problem+json")),
    E.getOrElse(() => serializationProblem)
  );
};
