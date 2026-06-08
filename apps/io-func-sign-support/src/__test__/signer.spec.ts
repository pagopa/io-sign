import { describe, it, expect } from "vitest";

import { pipe, identity } from "fp-ts/function";

import { fromEither, chainW } from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";

import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { validate } from "@io-sign/io-sign/validation";

import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

import { SignerRepository, getSignerByFiscalCode } from "../signer";

describe("getSignerByFiscalCode", () => {
  it('propagates an error from the repository', async () => {
    const signerRepository: SignerRepository = {
      getSignerByFiscalCode: () => TE.left(new EntityNotFoundError("The specified Signer was not found")),
      getFiscalCodeBySignerId: () => TE.left(new Error("Not implemented")),
    };
    const run = pipe(
      "CVLYCU95L20C351Z",
      validate(FiscalCode, "Invalid fiscal code."),
      fromEither,
      chainW((fiscalCode) => getSignerByFiscalCode(fiscalCode))
    )({
      signerRepository,
    });
    const result = pipe(await run(), E.getOrElseW(identity));
    expect(result).toBeInstanceOf(EntityNotFoundError);
  });
});
