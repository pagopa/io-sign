import { agent } from "@pagopa/ts-commons";

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { pipe, flow } from "fp-ts/lib/function";

import {
  AbortableFetch,
  setFetchTimeout,
  toFetch,
} from "@pagopa/ts-commons/lib/fetch";

import { Millisecond } from "@pagopa/ts-commons/lib/units";

import { HttpBadRequestError } from "@internal/io-sign/infra/http/errors";
import { validate } from "@internal/io-sign/validation";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { QtspConfig } from "./config";
import { ClausesMetadata } from "./clauses-metadata";

const QtspToken = t.type({
  access: NonEmptyString,
  refresh: NonEmptyString,
});

type QtspToken = t.TypeOf<typeof QtspToken>;

const httpApiFetch = agent.getHttpFetch(process.env);
const abortableFetch = AbortableFetch(httpApiFetch);

export const is2xx = (r: Response): boolean =>
  r.status >= 200 && r.status < 300;

export class QtspClient {
  private config: QtspConfig;
  private fetchWithTimeout;

  constructor(config: QtspConfig) {
    this.config = config;
    this.fetchWithTimeout = toFetch(
      setFetchTimeout(this.config.requestTimeout as Millisecond, abortableFetch)
    );
  }
  public getClauses = () =>
    pipe(
      this.getToken(),
      TE.chain((token) =>
        TE.tryCatch(
          () =>
            this.fetchWithTimeout(`${this.config.basePath}/api/tos/`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token.access}`,
              },
            }),
          E.toError
        )
      ),
      TE.chainW((response) =>
        is2xx(response)
          ? TE.tryCatch(() => response.json(), E.toError)
          : TE.left(
              new HttpBadRequestError(
                `An error occurred to retrieve the qtsp clauses`
              )
            )
      ),
      TE.chainW(
        flow(
          validate(ClausesMetadata, "Qtsp clauses metadata not valid"),
          TE.fromEither
        )
      )
    );

  private getToken = () =>
    pipe(
      TE.tryCatch(
        () =>
          this.fetchWithTimeout(`${this.config.basePath}/api/token/`, {
            body: JSON.stringify({
              username: this.config.username,
              password: this.config.password,
            }),
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }),
        E.toError
      ),
      TE.chainW((response) =>
        is2xx(response)
          ? TE.tryCatch(() => response.json(), E.toError)
          : TE.left(
              new HttpBadRequestError(
                `An error occurred to retrieve the auth token from QTSP | ${response.status}`
              )
            )
      ),
      TE.chainW(
        flow(validate(QtspToken, "Qtsp auth token not valid"), TE.fromEither)
      )
    );
}
