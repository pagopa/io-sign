import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { flow, pipe } from "fp-ts/lib/function";

import { Signer, SignerRepository } from "../../signer";

import { TooManyRequestsError } from "../../error";
import { validate } from "../../validation";
import { PdvTokenizerClientWithApiKey } from "./client";

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
            api_key: this.#pdv.apiKey
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
            api_key: this.#pdv.apiKey
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
