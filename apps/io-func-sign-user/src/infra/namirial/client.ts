import { agent } from "@pagopa/ts-commons";

import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { pipe } from "fp-ts/lib/function";

import {
  AbortableFetch,
  setFetchTimeout,
  toFetch,
} from "@pagopa/ts-commons/lib/fetch";

import { Millisecond } from "@pagopa/ts-commons/lib/units";

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
const contentType = "application/json";

const is2xx = (r: Response): boolean => r.status >= 200 && r.status < 300;
const responseToJson = (errorDetail: string) => (response: Response) =>
  is2xx(response)
    ? response.json()
    : Promise.reject(
        `${errorDetail}\nResponse status code: ${response.status}`
      );

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
    this.getToken()
      .then((token) =>
        this.fetchWithTimeout(`${this.config.basePath}/api/tos/`, {
          method: "GET",
          headers: {
            "Content-Type": contentType,
            Authorization: `Bearer ${token.access}`,
          },
        })
      )
      .then(
        responseToJson(
          "The attempt to retrieve the the clauses from the QTSP failed"
        )
      )
      .then((responseJson) =>
        pipe(
          ClausesMetadata.decode(responseJson),
          E.map((decoded) => Promise.resolve(decoded)),
          E.getOrElse((e) => Promise.reject(e))
        )
      );

  private getToken = () =>
    this.fetchWithTimeout(`${this.config.basePath}/api/token/`, {
      body: JSON.stringify({
        username: this.config.username,
        password: this.config.password,
      }),
      method: "POST",
      headers: {
        "Content-Type": contentType,
      },
    })
      .then(
        responseToJson(
          "The attempt to retrieve the the auth token from the QTSP failed"
        )
      )
      .then((responseJson) =>
        pipe(
          NamirialToken.decode(responseJson),
          E.map((decoded) => Promise.resolve(decoded)),
          E.getOrElse((e) => Promise.reject(e))
        )
      );
}
