import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";

import {
  HealthCheck,
  toHealthProblems,
} from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";

import { makeFetchWithTimeout } from "@io-sign/io-sign/infra/http/fetch-timeout";
import { LollipopApiClient } from "./client";

export type LollipopApiClientProblemSource = "LollipopApiClient";

export const makeLollipopClientHealthCheck =
  (client: LollipopApiClient) =>
  (
    fetchWithTimeout = makeFetchWithTimeout(),
  ): HealthCheck<LollipopApiClientProblemSource, true> =>
    pipe(
      TE.tryCatch(
        () => fetchWithTimeout(client.baseUrl, { method: "HEAD" }),
        toHealthProblems("LollipopApiClient"),
      ),
      TE.map(() => true),
    );
