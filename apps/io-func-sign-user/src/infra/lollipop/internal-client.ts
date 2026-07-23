import { agent } from "@pagopa/ts-commons";

import {
  AbortableFetch,
  setFetchTimeout,
  toFetch
} from "@pagopa/ts-commons/lib/fetch";

import { Millisecond } from "@pagopa/ts-commons/lib/units";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import { flow, pipe } from "fp-ts/lib/function";

import { AssertionRef } from "./models/AssertionRef";
import { AssertionType } from "./models/AssertionType";

const httpApiFetch = agent.getHttpFetch(process.env);
const abortableFetch = AbortableFetch(httpApiFetch);

// Regex to extract the nonce from the `signature-input` header value
// e.g. sig1=("signature"); nonce="abc123"; created=1234567890
const NONCE_REGEX = /;?nonce="([^"]+)";?/;

const getNonce = (signatureInput: string): E.Either<Error, NonEmptyString> => {
  const match = NONCE_REGEX.exec(signatureInput);
  return match?.[1]
    ? E.right(match[1] as NonEmptyString)
    : E.left(new Error('Missing nonce in "signature-input" header'));
};

// Minimal LcParams — only the fields needed by io-func-sign-user
export const LcParams = t.type({
  assertion_ref: AssertionRef,
  assertion_type: AssertionType,
  lc_authentication_bearer: NonEmptyString,
  pub_key: NonEmptyString
});
export type LcParams = t.TypeOf<typeof LcParams>;

export type LollipopApiClientInt = {
  readonly baseUrl: NonEmptyString;
  readonly apiKey: NonEmptyString;
  readonly fetchApi: typeof fetch;
};

export const createLollipopApiClientInt = (
  baseUrl: string,
  apiKey: string,
  timeout = 3000 as Millisecond
): LollipopApiClientInt => ({
  baseUrl: baseUrl as NonEmptyString,
  apiKey: apiKey as NonEmptyString,
  fetchApi: toFetch(
    setFetchTimeout(timeout, abortableFetch)
  ) as unknown as typeof fetch
});

/**
 * Calls the Lollipop internal API (`POST /api/v1/pubKeys/{assertionRef}/generate`)
 * to obtain the `lc_authentication_bearer` JWT required by `getAssertion`.
 *
 * Equivalent to what io-backend's `expressLollipopMiddleware` does via
 * `extractLollipopLocalsFromLollipopHeaders` → `generateLCParams`.
 */
export const makeGetLcParams =
  (client: LollipopApiClientInt) =>
  ({
    assertionRef,
    signatureInput
  }: {
    assertionRef: AssertionRef;
    signatureInput: string;
  }): TE.TaskEither<Error, LcParams> =>
    pipe(
      getNonce(signatureInput),
      TE.fromEither,
      TE.chainW((operationId) =>
        pipe(
          TE.tryCatch(
            () =>
              client.fetchApi(
                `${client.baseUrl}/api/v1/pubKeys/${assertionRef}/generate`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "X-Functions-Key": client.apiKey
                  },
                  body: JSON.stringify({ operation_id: operationId })
                }
              ),
            E.toError
          ),
          TE.chainW((response) =>
            response.ok
              ? TE.tryCatch(() => response.json(), E.toError)
              : TE.left(
                  new Error(
                    `generateLCParams failed with HTTP status ${response.status}`
                  )
                )
          ),
          TE.chainEitherKW(
            flow(
              LcParams.decode,
              E.mapLeft(
                () => new Error("Invalid response from generateLCParams")
              )
            )
          )
        )
      )
    );
