/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */
import * as TE from "fp-ts/lib/TaskEither";
import { GetFiscalCodeBySignerId } from "@io-sign/io-sign/signer";
import { describe, expect, it, jest } from "@jest/globals";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { some } from "fp-ts/lib/Option";
import { newId } from "@io-sign/io-sign/id";
import { EnqueueMessage } from "../../../infra/azure/storage/queue";
import { CreateSignatureRequest } from "../../../infra/namirial/signature-request";
import { InsertSignature } from "../../../signature";
import { makeCreateSignature } from "../create-signature";
import { aSignature } from "../__mocks__/signature";
import { aSignatureRequest } from "../__mocks__/signature-request";
import { aCreateSignaturePayload } from "../__mocks__/create-signature-payload";

const getFiscalCodeBySignerId = jest.fn<GetFiscalCodeBySignerId>();
const creatQtspSignatureRequest = jest.fn<CreateSignatureRequest>();
const insertSignature = jest.fn<InsertSignature>();
const enqueueSignature = jest.fn<EnqueueMessage>();

describe("makeCreateSignature", () => {
  it("should return a valid CreateSignaturePayload", async () => {
    getFiscalCodeBySignerId.mockReturnValueOnce(
      TE.of(some("SPNDNL80R13C523K" as FiscalCode))
    );
    const anInsertedSignatureId = newId();
    insertSignature.mockImplementation((s) =>
      TE.of({ ...s, id: anInsertedSignatureId })
    );
    enqueueSignature.mockReturnValueOnce(TE.of("messageId"));
    creatQtspSignatureRequest.mockReturnValueOnce(TE.of(aSignatureRequest));
    const createSignature = makeCreateSignature(
      getFiscalCodeBySignerId,
      creatQtspSignatureRequest,
      insertSignature,
      enqueueSignature
    );

    await createSignature(aCreateSignaturePayload)();

    expect(getFiscalCodeBySignerId).toHaveBeenCalled();
    expect(getFiscalCodeBySignerId).toHaveBeenCalledWith(
      "signerId" as NonEmptyString
    );
    expect(creatQtspSignatureRequest).toHaveBeenCalled();
    expect(insertSignature).toHaveBeenCalled();
    expect(enqueueSignature).toHaveBeenCalled();
    expect(enqueueSignature).toHaveBeenCalledWith(
      JSON.stringify({
        signatureId: anInsertedSignatureId,
        signerId: aSignature.signerId,
      })
    );
  });

  // test that the use case returns error in case creatQtspSignatureRequest returns a status which is not CREATED
  it("should return error in case creatQtspSignatureRequest returns a status which is not CREATED", async () => {
    getFiscalCodeBySignerId.mockReturnValueOnce(
      TE.of(some("SPNDNL80R13C523K" as FiscalCode))
    );
    const anInsertedSignatureId = newId();
    insertSignature.mockImplementation((s) =>
      TE.of({ ...s, id: anInsertedSignatureId })
    );
    enqueueSignature.mockReturnValueOnce(TE.of("messageId"));
    creatQtspSignatureRequest.mockReturnValueOnce(
      TE.of({ ...aSignatureRequest, status: "ERROR" as any })
    );
    const createSignature = makeCreateSignature(
      getFiscalCodeBySignerId,
      creatQtspSignatureRequest,
      insertSignature,
      enqueueSignature
    );

    await createSignature(aCreateSignaturePayload)().catch((e) => {
      expect(e).toEqual(new Error("Error creating qtsp signature request"));
    });

    expect(getFiscalCodeBySignerId).toHaveBeenCalled();
    expect(getFiscalCodeBySignerId).toHaveBeenCalledWith(
      "signerId" as NonEmptyString
    );
    expect(creatQtspSignatureRequest).toHaveBeenCalled();
    expect(insertSignature).not.toHaveBeenCalled();
    expect(enqueueSignature).not.toHaveBeenCalled();
  });
});
