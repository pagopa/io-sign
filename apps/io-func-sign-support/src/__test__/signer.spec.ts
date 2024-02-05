import { describe, it, expect, vi } from "vitest";

import { pipe, identity } from "fp-ts/function";

import { fromEither, chainW } from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";

import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { validate } from "@io-sign/io-sign/validation";

import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

import { SignerRepository, getSignerByFiscalCode } from "../signer";

describe("getSignerByFiscalCode", () => {
  it('returns an "EntityNotFoundError" when the resource was not found', async () => {
    const signerRepository: SignerRepository = {
      getByFiscalCode: vi.fn(() => TE.right(O.none)),
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
