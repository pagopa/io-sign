import { createHandler, nopRequestDecoder } from "@pagopa/handler-kit";
import * as azure from "@pagopa/handler-kit/lib/azure";

import { success } from "@internal/io-sign/infra/http/response";

import * as TE from "fp-ts/lib/TaskEither";

import { pipe, identity } from "fp-ts/lib/function";

import * as t from "io-ts";

const makeInfoHandler = () =>
  createHandler(
    nopRequestDecoder,
    () =>
      TE.right({
        message: "it works",
      }),
    identity,
    success(
      t.type({
        message: t.string,
      })
    )
  );

export const run = pipe(makeInfoHandler(), azure.unsafeRun);
