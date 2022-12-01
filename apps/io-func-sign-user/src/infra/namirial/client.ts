import { agent } from "@pagopa/ts-commons";
import * as t from "io-ts";
import * as E from "fp-ts/lib/Either";
import { flow, pipe } from "fp-ts/lib/function";

import {
  AbortableFetch,
  setFetchTimeout,
  toFetch,
} from "@pagopa/ts-commons/lib/fetch";

import { Millisecond } from "@pagopa/ts-commons/lib/units";

import * as TE from "fp-ts/lib/TaskEither";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NamirialConfig } from "./config";
import { ClausesMetadata } from "./clauses-metadata";

const NamirialToken = t.type({
  access: NonEmptyString,
  refresh: NonEmptyString,
});
type NamirialToken = t.TypeOf<typeof NamirialToken>;

const is2xx = (r: Response): boolean => r.status >= 200 && r.status < 300;

const getFetchWithTimeout = (
  requestTimeoutMs: Millisecond = 5000 as Millisecond,
  env = process.env
) =>
  pipe(
    setFetchTimeout(
      requestTimeoutMs,
      pipe(env, agent.getHttpFetch, AbortableFetch)
    ),
    toFetch
  );

export const makeGetToken =
  (fetchWithTimeout = getFetchWithTimeout()) =>
  ({ basePath, username, password }: NamirialConfig) =>
    pipe(
      TE.tryCatch(
        () =>
          fetchWithTimeout(`${basePath}/api/token/`, {
            body: JSON.stringify({
              username,
              password,
            }),
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }),
        E.toError
      ),
      TE.filterOrElse(
        (response) => is2xx(response),
        () => new Error("The attempt to get Namirial token failed.")
      ),
      TE.chain((response) => TE.tryCatch(() => response.json(), E.toError)),
      TE.chainEitherKW(
        flow(
          NamirialToken.decode,
          E.mapLeft(
            (errs) =>
              new Error(
                `Invalid format for Namirial token: ${readableReport(errs)}`
              )
          )
        )
      )
    );

export const makeGetClauses =
  (fetchWithTimeout = getFetchWithTimeout()) =>
  (getToken: ReturnType<typeof makeGetToken>) =>
  (config: NamirialConfig) =>
    pipe(
      getToken(config),
      TE.chain((token) =>
        TE.tryCatch(
          () =>
            fetchWithTimeout(`${config.basePath}/api/tos/`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token.access}`,
              },
            }),
          E.toError
        )
      ),
      TE.filterOrElse(
        (response) => is2xx(response),
        () => new Error("The attempt to get Namirial clauses failed.")
      ),
      TE.chain((response) => TE.tryCatch(() => response.json(), E.toError)),
      TE.chainEitherKW(
        flow(
          ClausesMetadata.decode,
          E.mapLeft(
            (errs) =>
              new Error(
                `Invalid format for Namirial clauses: ${readableReport(errs)}`
              )
          )
        )
      )
    );
