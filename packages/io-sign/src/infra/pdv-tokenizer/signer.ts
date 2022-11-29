import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { pipe, flow } from "fp-ts/lib/function";

import { PdvTokenizerClientWithApiKey } from "./client";

import { GetFiscalCodeBySignerId, GetSignerByFiscalCode } from "../../signer";

import { TooManyRequestsError } from "../../error";
import { HttpBadRequestError } from "../http/errors";

export const makeGetSignerByFiscalCode =
  (clientPayload: PdvTokenizerClientWithApiKey): GetSignerByFiscalCode =>
  (fiscalCode) =>
    pipe(
      TE.tryCatch(
        () =>
          clientPayload.client.saveUsingPUT({
            body: { pii: fiscalCode },
            api_key: clientPayload.apiKey,
          }),
        E.toError
      ),
      TE.chain(
        flow(
          E.mapLeft(() => new Error("Unable to get signerId from tokenizer!")),
          E.chainW((response) => {
            switch (response.status) {
              case 200:
                return E.right(response.value);
              case 429:
                return E.left(new TooManyRequestsError(`Too many requests!`));
              default:
                return E.left(
                  new HttpBadRequestError(
                    `The attempt to get signer's fiscal code from his identifier failed.`
                  )
                );
            }
          }),
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
    );

export const makeGetFiscalCodeBySignerId =
  (clientPayload: PdvTokenizerClientWithApiKey): GetFiscalCodeBySignerId =>
  (signerId) =>
    pipe(
      TE.tryCatch(
        () =>
          clientPayload.client.findPiiUsingGET({
            token: signerId,
            api_key: clientPayload.apiKey,
          }),
        E.toError
      ),
      TE.chain(
        flow(
          E.mapLeft(
            () => new Error("Unable to get fiscal code from tokenizer!")
          ),
          E.chainW((response) => {
            switch (response.status) {
              case 200:
                return E.right(response.value);
              case 429:
                return E.left(new TooManyRequestsError(`Too many requests!`));
              default:
                return E.left(
                  new HttpBadRequestError(
                    `An error occurred to retrieve the fiscal code from the signerId`
                  )
                );
            }
          }),
          TE.fromEither,
          TE.map(
            flow(
              O.fromNullable,
              O.map((piiResponse) => piiResponse.pii as FiscalCode)
            )
          )
        )
      )
    );
