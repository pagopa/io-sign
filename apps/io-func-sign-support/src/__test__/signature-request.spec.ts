import { describe, it, expect, vi, beforeAll } from "vitest";

import { newId, Id } from "@io-sign/io-sign/id";
import { EntityNotFoundError } from "@io-sign/io-sign/error";

import { pipe, identity } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";

import {
  getSignatureRequestById,
  SignatureRequestRepository,
} from "../signature-request";

const notImplementedMock = () =>
  vi.fn(() => TE.left(new Error("not implemented.")));

describe("getSignatureRequestById", () => {
  let repo: SignatureRequestRepository;
  beforeAll(() => {
    repo = {
      getBySignerId: notImplementedMock(),
      getByIssuerId: notImplementedMock(),
    };
  });
  it("calls the right repository method based on payload", () => {
    const inputs: Record<"issuer" | "signer", [Id, Id]> = {
      issuer: [newId(), newId()],
      signer: [newId(), newId()],
    };
    getSignatureRequestById({
      id: inputs.issuer[0],
      issuerId: inputs.issuer[1],
    })({
      signatureRequestRepository: repo,
    });
    getSignatureRequestById({
      id: inputs.signer[0],
      signerId: inputs.signer[1],
    })({
      signatureRequestRepository: repo,
    });
    expect(repo.getByIssuerId).toHaveBeenCalled();
    expect(repo.getBySignerId).toHaveBeenCalled();
    expect(repo.getByIssuerId).toHaveBeenCalledWith(...inputs.issuer);
    expect(repo.getBySignerId).toHaveBeenCalledWith(...inputs.signer);
  });
  it('returns an "EntityNotFoundError" when the resource was not found', async () => {
    const getMockedSignerById = vi.fn(() => TE.right(O.none));
    const repoWithASigner: SignatureRequestRepository = {
      getBySignerId: getMockedSignerById,
      getByIssuerId: notImplementedMock(),
    };
    const run = getSignatureRequestById({
      id: newId(),
      signerId: newId(),
    })({
      signatureRequestRepository: repoWithASigner,
    });
    const result = pipe(await run(), E.getOrElseW(identity));
    expect(result).toBeInstanceOf(EntityNotFoundError);
  });
});
