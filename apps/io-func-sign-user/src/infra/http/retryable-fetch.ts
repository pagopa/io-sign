import { calculateExponentialBackoffInterval } from "@pagopa/ts-commons/lib/backoff";
import {
  AbortableFetch,
  retriableFetch,
  setFetchTimeout,
  toFetch,
} from "@pagopa/ts-commons/lib/fetch";
import {
  RetriableTask,
  TransientError,
  withRetries,
} from "@pagopa/ts-commons/lib/tasks";
import { Millisecond } from "@pagopa/ts-commons/lib/units";
import { TaskEither } from "fp-ts/lib/TaskEither";

import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

export const retryingFetch = (
  fetchApi: typeof fetch,
  timeout: Millisecond = 10000 as Millisecond,
  maxRetries: number = 3
): typeof fetch => {
  // a fetch that can be aborted and that gets cancelled after fetchTimeoutMs
  const abortableFetch = AbortableFetch(fetchApi);
  const timeoutFetch = toFetch(setFetchTimeout(timeout, abortableFetch));

  // configure retry logic with default exponential backoff
  // @see https://github.com/teamdigitale/italia-ts-commons/blob/master/src/backoff.ts
  const exponentialBackoff = calculateExponentialBackoffInterval();
  const retryLogic = withRetries<Error, Response>(
    maxRetries,
    exponentialBackoff
  );
  const retryWithTransient429s = retryLogicForTransientResponseError(
    (_) => _.status === 429,
    retryLogic
  );
  // TODO: remove the cast once we upgrade to tsc >= 3.1
  return retriableFetch(retryWithTransient429s)(timeoutFetch as typeof fetch);
};

/**
 * Fetch with transient error handling. Handle error that occurs once or at unpredictable intervals.
 */
export function retryLogicForTransientResponseError(
  predicate: (r: Response) => boolean,
  retryLogic: (
    task: RetriableTask<Error, Response>,
    shouldAbort?: Promise<boolean>
  ) => TaskEither<Error | "max-retries" | "retry-aborted", Response>
): typeof retryLogic {
  return (
    task: RetriableTask<Error, Response>,
    shouldAbort?: Promise<boolean>
  ) =>
    retryLogic(
      // when the result of the task is a Response that satisfies
      // the predicate, map it to a transient error
      pipe(
        task,
        TE.chain((response) =>
          predicate(response) ? TE.left(TransientError) : TE.right(response)
        )
      ),
      shouldAbort
    );
}
