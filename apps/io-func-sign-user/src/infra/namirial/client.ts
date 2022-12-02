import * as t from "io-ts";
import * as E from "fp-ts/lib/Either";
import { flow, pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { makeFetchWithTimeout } from "../http/fetch-timeout";
import { NamirialConfig } from "./config";
import { ClausesMetadata } from "./clauses-metadata";

const NamirialToken = t.type({
  access: NonEmptyString,
  refresh: NonEmptyString,
});
type NamirialToken = t.TypeOf<typeof NamirialToken>;

const isSuccessful = (r: Response): boolean =>
  r.status >= 200 && r.status < 300;

export const makeGetToken =
  (fetchWithTimeout = makeFetchWithTimeout()) =>
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
        isSuccessful,
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
  (fetchWithTimeout = makeFetchWithTimeout()) =>
  ({ basePath }: NamirialConfig) =>
  (token: NamirialToken) =>
    pipe(
      TE.of(token),
      TE.chain((token) =>
        TE.tryCatch(
          () =>
            fetchWithTimeout(`${basePath}/api/tos/`, {
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
        isSuccessful,
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

export const makeGetClausesWithToken =
  (fetchWithTimeout = makeFetchWithTimeout()) =>
  (getToken: ReturnType<typeof makeGetToken>) =>
  (config: NamirialConfig) =>
    pipe(getToken(config), TE.chain(makeGetClauses(fetchWithTimeout)(config)));
