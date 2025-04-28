import {
  HealthCheck,
  toHealthProblems
} from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { makeFetchWithTimeout } from "../http/fetch-timeout";
import { IOApiClient } from "./client";

export type IOServicesProblemSource = "IOServices";

export const makeIOServicesHealthCheck =
  (client: IOApiClient) =>
  (
    fetchWithTimeout = makeFetchWithTimeout()
  ): HealthCheck<IOServicesProblemSource, true> =>
    pipe(
      TE.tryCatch(
        () => fetchWithTimeout(client.baseUrl, { method: "HEAD" }),
        toHealthProblems("IOServices")
      ),
      TE.map(() => true)
    );
