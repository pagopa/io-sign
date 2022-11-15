import {
  GetFiscalCodeBySignerId,
  GetSignerByFiscalCode,
} from "@internal/io-sign/signer";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { PdvTokenizerClient } from "./client";

// TODO: This is a mock
export const makeGetSignerByFiscalCode =
  (_client: PdvTokenizerClient) => (): GetSignerByFiscalCode => (fiscalCode) =>
    TE.right(
      O.some({
        id: `${fiscalCode}-signer` as NonEmptyString,
      })
    );

// TODO: This is a mock
export const makeGetFiscalCodeBySignerId =
  (_client: PdvTokenizerClient): GetFiscalCodeBySignerId =>
  (_id) =>
    pipe(
      "GRSFNC93A22A509H",
      FiscalCode.decode,
      TE.fromEither,
      TE.map(O.some),
      TE.mapLeft(() => new Error("Invalid fiscal code"))
    );
