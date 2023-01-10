import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";

import * as RA from "fp-ts/lib/ReadonlyArray";
import * as A from "fp-ts/lib/Array";

import {
  HealthProblem,
  HealthCheck,
  toHealthProblems,
} from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";

import { makeFetchWithTimeout } from "@io-sign/io-sign/infra/http/fetch-timeout";
import { NamirialConfig } from "./config";
import { makeGetClauses, makeGetToken, NamirialToken } from "./client";

export type NamirialProblemSource =
  | "NamirialLogin"
  | "NamirialTos"
  | "NamirialTosEndpoint";

const formatProblem = (
  source: NamirialProblemSource,
  message: string
): HealthProblem<NamirialProblemSource> =>
  `${source}|${message}` as HealthProblem<NamirialProblemSource>;

const checkGetTokenHealth = (config: NamirialConfig) =>
  pipe(
    makeGetToken()(config),
    TE.mapLeft((e) => [formatProblem("NamirialLogin", e.message)])
  );

const checkGetTosHealth = (config: NamirialConfig) => (token: NamirialToken) =>
  pipe(
    token,
    makeGetClauses()(config),
    TE.mapLeft((e) => [formatProblem("NamirialTos", e.message)])
  );

const checkTosUrlHealth =
  (fetchWithTimeout = makeFetchWithTimeout()) =>
  (url: string) =>
    pipe(
      TE.tryCatch(
        () => fetchWithTimeout(url, { method: "HEAD" }),
        toHealthProblems("NamirialTosEndpoint")
      ),
      TE.map(() => true)
    );

const applicativeValidation = TE.getApplicativeTaskValidation(
  T.ApplicativePar,
  RA.getSemigroup<HealthProblem<NamirialProblemSource>>()
);

export const makeNamirialHealthCheck = (
  config: NamirialConfig
): HealthCheck<NamirialProblemSource, true> =>
  pipe(
    config,
    checkGetTokenHealth,
    TE.chainW(checkGetTosHealth(config)),
    TE.chainW((tos) =>
      pipe(
        [
          checkTosUrlHealth()(tos.document_link),
          checkTosUrlHealth()(tos.privacy_link),
          checkTosUrlHealth()(tos.terms_and_conditions_link),
        ],
        A.sequence(applicativeValidation)
      )
    ),
    TE.map(() => true)
  );
