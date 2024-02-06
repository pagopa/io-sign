import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { pipe, flow } from "fp-ts/lib/function";

import {
  GetFiscalCodeBySignerId,
  GetSignerByFiscalCode,
  Signer,
  SignerRepository,
} from "../../signer";

import { TooManyRequestsError } from "../../error";
import { HttpBadRequestError } from "../http/errors";
import { PdvTokenizerClient, PdvTokenizerClientWithApiKey } from "./client";
import { validate } from "../../validation";
import { parse } from "date-fns";

/** @deprecated use "PdvTokenizerSignerRepository" instead */
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

/** @deprecated use "PdvTokenizerSignerRepository" instead */
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

export class PdvTokenizerSignerRepository implements SignerRepository {
  #pdv: PdvTokenizerClientWithApiKey;

  constructor(pdv: PdvTokenizerClientWithApiKey) {
    this.#pdv = pdv;
  }

  getSignerByFiscalCode(fiscalCode: FiscalCode) {
    return pipe(
      TE.tryCatch(
        () =>
          this.#pdv.client.saveUsingPUT({
            body: { pii: fiscalCode },
            api_key: this.#pdv.apiKey,
          }),
        E.toError
      ),
      TE.chainEitherK(
        flow(
          E.mapLeft(() => new Error("Unable to retrieve the signer id")),
          E.chainW((response) => {
            switch (response.status) {
              case 200:
                return E.right(response.value.token);
              case 429:
                return E.left(new TooManyRequestsError("Rate limit excedeed."));
            }
            return E.left(
              new Error("An unexpected error has occurred. Try again later.")
            );
          })
        )
      ),
      TE.chainEitherKW(validate(NonEmptyString)),
      TE.map((id) => ({ id }))
    );
  }

  getFiscalCodeBySignerId(id: Signer["id"]) {
    return pipe(
      TE.tryCatch(
        () =>
          this.#pdv.client.findPiiUsingGET({
            token: id,
            api_key: this.#pdv.apiKey,
          }),
        E.toError
      ),
      TE.chainEitherK(
        flow(
          E.mapLeft(() => new Error("Unable to retrieve the fiscal code")),
          E.chainW((response) => {
            switch (response.status) {
              case 200:
                return E.right(response.value.pii);
              case 429:
                return E.left(new TooManyRequestsError("Rate limit excedeed."));
            }
            return E.left(
              new Error("An unexpected error has occurred. Try again later.")
            );
          })
        )
      ),
      TE.chainEitherKW(validate(FiscalCode))
    );
  }
}
