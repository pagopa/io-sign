/* eslint-disable perfectionist/sort-modules */
import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";

import {
  HealthCheck,
  toHealthProblems
} from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";

import { makeFetchWithTimeout } from "@io-sign/io-sign/infra/http/fetch-timeout";
import { LollipopApiClientExt } from "./client";
import type { LollipopApiClientInt } from "./lc-params";

export type LollipopApiClientExtProblemSource = "LollipopApiClientExt";
export type LollipopApiClientIntProblemSource = "LollipopApiClientInt";

export const makeLollipopExtClientHealthCheck =
  (client: LollipopApiClientExt) =>
  (
    fetchWithTimeout = makeFetchWithTimeout()
  ): HealthCheck<LollipopApiClientExtProblemSource, true> =>
    pipe(
      TE.tryCatch(
        () => fetchWithTimeout(client.baseUrl, { method: "HEAD" }),
        toHealthProblems("LollipopApiClientExt")
      ),
      TE.map(() => true)
    );

export const makeLollipopIntClientHealthCheck =
  (client: LollipopApiClientInt) =>
  (): HealthCheck<LollipopApiClientIntProblemSource, true> =>
    pipe(
      TE.tryCatch(
        () => client.fetchApi(client.baseUrl, { method: "HEAD" }),
        toHealthProblems("LollipopApiClientInt")
      ),
      TE.map(() => true)
    );
