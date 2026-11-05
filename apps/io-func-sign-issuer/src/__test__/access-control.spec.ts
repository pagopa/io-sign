import { describe, expect, it } from "vitest";

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import { newId } from "@io-sign/io-sign/id";

import {
  AccessControlRepository,
  ApiKeyAccessControl,
  ensureFiscalCodeAllowed
} from "../access-control";

const subscriptionId = newId();
const testerFiscalCode = "AAAAAA00A00A000A";
const noTesterFiscalCode = "BBBBBB00B00B000B";

const makeRepository = (
  result: ApiKeyAccessControl | Error
): AccessControlRepository => ({
  getApiKeyAccessControl: (id) =>
    id === subscriptionId
      ? result instanceof Error
        ? TE.left(result)
        : TE.right(result)
      : TE.left(new Error("unexpected subscription id"))
});

const run = (repository: AccessControlRepository, fiscalCode: string) =>
  ensureFiscalCodeAllowed(
    subscriptionId,
    fiscalCode
  )({ accessControlRepository: repository })();

describe("ensureFiscalCodeAllowed", () => {
  it("allows any fiscal code when the environment is prod", async () => {
    const repository = makeRepository({ environment: "prod", testers: [] });
    expect(await run(repository, noTesterFiscalCode)).toEqual(
      E.right(undefined)
    );
  });

  it("allows a tester when the environment is test", async () => {
    const repository = makeRepository({
      environment: "test",
      testers: [testerFiscalCode]
    });
    expect(await run(repository, testerFiscalCode)).toEqual(E.right(undefined));
  });

  it("rejects a fiscal code that is not a tester when the environment is test", async () => {
    const repository = makeRepository({
      environment: "test",
      testers: [testerFiscalCode]
    });
    expect(await run(repository, noTesterFiscalCode)).toEqual(
      E.left(expect.objectContaining({ name: "HttpError", status: 403 }))
    );
  });

  it("rejects everyone when the environment is test and there are no testers", async () => {
    const repository = makeRepository({ environment: "test", testers: [] });
    expect(await run(repository, testerFiscalCode)).toEqual(
      E.left(expect.objectContaining({ status: 403 }))
    );
  });

  it("propagates the error of the repository", async () => {
    const error = new Error("back office unavailable");
    const result = await run(makeRepository(error), testerFiscalCode);
    expect(result).toEqual(E.left(error));
  });
});
