import {
  response,
  withStatusCode,
  withHeader,
  serializeToJSON,
} from "@pagopa/handler-kit/lib/http";

import { pipe, flow } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";

import * as t from "io-ts";
import { validate } from "../../validation";

import { HttpError, HttpErrorFromError } from "./errors";

import { toProblemDetail } from "./problem-detail";

const serializationProblem = pipe(
  new HttpError("Unable to serialize the response."),
  toProblemDetail,
  JSON.stringify,
  response,
  withStatusCode(500),
  // eslint-disable-next-line sonarjs/no-duplicate-string
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

const bufferResponse =
  (statusCode: number) => (contentType: string) => (buffer: Buffer) =>
    pipe(
      // body of the response must be of type string, but buffer.toString appends some extra characters which corrupt the final file even with byte-encoding.
      buffer as unknown as string,
      response,
      withStatusCode(statusCode),
      withHeader("Content-Type", contentType),
      withHeader("Content-Length", Buffer.byteLength(buffer).toString())
    );

export const success = jsonResponse(200);
export const created = jsonResponse(201);
export const successBuffer = bufferResponse(200);

export const error = (e: Error) =>
  pipe(
    HttpErrorFromError.decode(e),
    E.orElse(() => E.right(e)),
    E.map((e) => {
      console.log(e);
      return e;
    }),
    E.map(
      flow(toProblemDetail, response, (res) =>
        pipe(res, withStatusCode(res.body.status))
      )
    ),
    E.chainW(serializeToJSON),
    E.map(withHeader("Content-Type", "application/problem+json")),
    E.getOrElse(() => serializationProblem)
  );
