import * as t from "io-ts";
import * as E from "fp-ts/lib/Either";
import { flow, pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { HttpBadRequestError } from "@io-sign/io-sign/infra/http/errors";
import { makeFetchWithTimeout } from "@io-sign/io-sign/infra/http/fetch-timeout";
import {
  defaultHeader,
  isSuccessful,
  responseToJson
} from "@io-sign/io-sign/infra/client-utils";
import { NamirialCredentialsConfig } from "./config";
import { ClausesMetadata } from "./clauses-metadata";
import {
  CreateSignatureRequestBody as CreateSignatureRequestBody,
  SignatureRequest
} from "./signature-request";

export const NamirialToken = t.type({
  access: NonEmptyString,
  refresh: NonEmptyString
});
export type NamirialToken = t.TypeOf<typeof NamirialToken>;

export const makeGetToken =
  (fetchWithTimeout = makeFetchWithTimeout()) =>
  ({ basePath, username, password }: NamirialCredentialsConfig) =>
    pipe(
      TE.tryCatch(
        () =>
          fetchWithTimeout(`${basePath}/api/token/`, {
            body: JSON.stringify({
              username,
              password
            }),
            method: "POST",
            headers: defaultHeader
          }),
        E.toError
      ),
      TE.filterOrElse(
        isSuccessful,
        () => new Error("The attempt to get Namirial token failed.")
      ),
      TE.chain(
        responseToJson(NamirialToken, `Invalid format for Namirial token`)
      )
    );

export const makeGetClauses =
  (fetchWithTimeout = makeFetchWithTimeout()) =>
  ({ basePath }: NamirialCredentialsConfig) =>
  (token: NamirialToken) =>
    pipe(
      TE.of(token),
      TE.chain((token) =>
        TE.tryCatch(
          () =>
            fetchWithTimeout(`${basePath}/api/tos/`, {
              method: "GET",
              headers: {
                ...defaultHeader,
                Authorization: `Bearer ${token.access}`
              }
            }),
          E.toError
        )
      ),
      TE.filterOrElse(
        isSuccessful,
        () => new Error("The attempt to get Namirial clauses failed.")
      ),
      TE.chain(
        responseToJson(ClausesMetadata, `Invalid format for Namirial clauses`)
      )
    );

export const makeCreateSignatureRequest =
  (fetchWithTimeout = makeFetchWithTimeout()) =>
  ({ basePath }: NamirialCredentialsConfig) =>
  (token: NamirialToken) =>
  (body: CreateSignatureRequestBody) =>
    pipe(
      TE.of(token),
      TE.chain((token) =>
        TE.tryCatch(
          () =>
            fetchWithTimeout(`${basePath}/api/requests/`, {
              method: "POST",
              headers: {
                ...defaultHeader,
                Authorization: `Bearer ${token.access}`,
                "Content-Transfer-Encoding": "application/json"
              },
              body: JSON.stringify(body)
            }),
          E.toError
        )
      ),

      TE.chain((response) =>
        pipe(
          TE.tryCatch(() => response.json(), E.toError),
          TE.filterOrElse(
            () => isSuccessful(response),
            (error): Error =>
              new HttpBadRequestError(
                `The attempt to create Namirial signature request failed. | ${JSON.stringify(
                  error
                )}`
              )
          )
        )
      ),
      TE.chainEitherKW(
        flow(
          SignatureRequest.decode,
          E.mapLeft(
            (errs): Error =>
              new HttpBadRequestError(
                `Invalid format for Namirial signature request: ${readableReport(
                  errs
                )}`
              )
          )
        )
      )
    );

export const makeGetSignatureRequest =
  (fetchWithTimeout = makeFetchWithTimeout()) =>
  ({ basePath }: NamirialCredentialsConfig) =>
  (token: NamirialToken) =>
  (signatureRequestId: SignatureRequest["id"]) =>
    pipe(
      TE.of(token),
      TE.chain((token) =>
        TE.tryCatch(
          () =>
            fetchWithTimeout(`${basePath}/api/requests/${signatureRequestId}`, {
              method: "GET",
              headers: {
                ...defaultHeader,
                Authorization: `Bearer ${token.access}`
              }
            }),
          E.toError
        )
      ),
      TE.filterOrElse(
        isSuccessful,
        () => new Error("The attempt to get Namirial signature request failed.")
      ),
      TE.chain(
        responseToJson(
          SignatureRequest,
          `Invalid format for Namirial signature request`
        )
      )
    );

export const makeGetClausesWithToken =
  (fetchWithTimeout = makeFetchWithTimeout()) =>
  (getToken: ReturnType<typeof makeGetToken>) =>
  (config: NamirialCredentialsConfig) =>
    pipe(getToken(config), TE.chain(makeGetClauses(fetchWithTimeout)(config)));
