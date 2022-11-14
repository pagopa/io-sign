import {
  GetFiscalCodeBySignerId,
  GetSignerByFiscalCode,
} from "@internal/io-sign/signer";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { pipe, flow } from "fp-ts/lib/function";
import { readFromEnvironment } from "@internal/io-sign/infra/env";
import { PdvTokenizerClient } from "./client";

export const makeGetSignerByFiscalCode =
  (client: PdvTokenizerClient): GetSignerByFiscalCode =>
  (fiscalCode) =>
    pipe(
      process.env,
      readFromEnvironment("PdvTokenizerApiKey"),
      TE.fromEither,
      TE.chain((apiKey) =>
        pipe(
          TE.tryCatch(
            () =>
              client.saveUsingPUT({
                body: { pii: fiscalCode },
                api_key: apiKey,
              }),
            E.toError
          ),
          TE.chain(
            flow(
              E.mapLeft(
                () => new Error("Unable to get signerId from tokenizer!")
              ),
              E.chainW((response) =>
                response.status === 200
                  ? E.right(response.value)
                  : E.left(
                      new Error(
                        "An error occurred while connecting to the tokenizer to get signerId !"
                      )
                    )
              ),
              TE.fromEither,
              TE.map(
                flow(
                  O.fromNullable,
                  O.map((tokenResponse) => ({
                    id: tokenResponse.token as NonEmptyString,
                  }))
                )
              )
            )
          )
        )
      )
    );

export const makeGetFiscalCodeBySignerId =
  (client: PdvTokenizerClient): GetFiscalCodeBySignerId =>
  (signerId) =>
    pipe(
      process.env,
      readFromEnvironment("PdvTokenizerApiKey"),
      TE.fromEither,
      TE.chain((apiKey) =>
        pipe(
          TE.tryCatch(
            () =>
              client.findPiiUsingGET({
                token: signerId,
                api_key: apiKey,
              }),
            E.toError
          ),
          TE.chain(
            flow(
              E.mapLeft(
                () => new Error("Unable to get fiscal code from tokenizer!")
              ),
              E.chainW((response) =>
                response.status === 200
                  ? E.right(response.value)
                  : E.left(
                      new Error(
                        "An error occurred while connecting to the tokenizer to get fiscal code!"
                      )
                    )
              ),
              TE.fromEither,
              TE.map(
                flow(
                  O.fromNullable,
                  O.map((piiResponse) => piiResponse.pii as FiscalCode)
                )
              )
            )
          )
        )
      )
    );
