import { describe, it, expect, vi } from "vitest";

import { pipe, identity } from "fp-ts/function";

import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";

import { EntityNotFoundError } from "@io-sign/io-sign/error";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { IssuerRepository, getIssuerByVatNumber } from "../issuer";

describe("getIssuerByVatNumber", () => {
  it('returns an "EntityNotFoundError" when the resource was not found', async () => {
    const issuerRepository: IssuerRepository = {
      getByVatNumber: vi.fn(() => TE.right(O.none)),
    };
    const run = getIssuerByVatNumber("11245371228" as NonEmptyString)({
      issuerRepository,
    });
    const result = pipe(await run(), E.getOrElseW(identity));
    expect(result).toBeInstanceOf(EntityNotFoundError);
  });
});
