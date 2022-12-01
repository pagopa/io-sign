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
import { NamirialConfig } from "./config";
import { ClausesMetadata } from "./clauses-metadata";

const NamirialToken = t.type({
  access: NonEmptyString,
  refresh: NonEmptyString,
});

type NamirialToken = t.TypeOf<typeof NamirialToken>;

const httpApiFetch = agent.getHttpFetch(process.env);
const abortableFetch = AbortableFetch(httpApiFetch);

export const is2xx = (r: Response): boolean =>
  r.status >= 200 && r.status < 300;

export class NamirialClient {
  private config: NamirialConfig;
  private fetchWithTimeout;

  constructor(config: NamirialConfig) {
    this.config = config;
    this.fetchWithTimeout = toFetch(
      setFetchTimeout(
        this.config.requestTimeoutMs as Millisecond,
        abortableFetch
      )
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
                `The attempt to retrieve the qtsp clauses failed.`
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
                `The attempt to retrieve the the auth token from the QTSP failed: ${response.status}`
              )
            )
      ),
      TE.chainW(
        flow(
          validate(NamirialToken, "Qtsp auth token not valid"),
          TE.fromEither
        )
      )
    );
}
