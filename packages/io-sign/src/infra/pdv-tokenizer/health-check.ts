import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";

import {
  HealthCheck,
  toHealthProblems
} from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";

import { makeFetchWithTimeout } from "../http/fetch-timeout";
import { PdvTokenizerClientWithApiKey } from "./client";

export type TokenizerProblemSource = "PdvTokenizer";

export const makePdvTokenizerHealthCheck =
  (client: PdvTokenizerClientWithApiKey) =>
  (
    fetchWithTimeout = makeFetchWithTimeout()
  ): HealthCheck<TokenizerProblemSource, true> =>
    pipe(
      TE.tryCatch(
        () => fetchWithTimeout(client.baseUrl, { method: "HEAD" }),
        toHealthProblems("PdvTokenizer")
      ),
      TE.map(() => true)
    );
