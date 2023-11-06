import * as TE from "fp-ts/lib/TaskEither";
import { it, describe, expect, vi, beforeAll } from "vitest";
import { onSelfcareContractsMessageHandler } from "../on-selfcare-contracts-message";
import { ioSignContracts } from "@/infra/selfcare/contract";
import * as issuerMessage from "@/infra/slack/issuer-message";
import { IoTsType } from "../validation";
import { isLeft } from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { GetById, Issuer } from "@/infra/back-office/issuer";
import { SendMessage } from "@/infra/slack/message";

describe("onSelfcareContractsMessage handler", () => {
  let getById: GetById["getById"];
  let sendMessage: SendMessage["sendMessage"];

  const issuer: Issuer = {
    id: "id",
    type: "PA",
    externalId: "externalId",
    institutionId: "27e11a61-85bb-4dd5-95ff-d7f337058d99",
    supportEmail: "foo.bar@pagopa.it",
    status: "active",
  };

  const mocks = { issuer };

  beforeAll(() => {
    getById = (id) =>
      mocks.issuer.id === id
        ? TE.right(O.some(mocks.issuer))
        : TE.right(O.none);
    sendMessage = () => TE.right(undefined);
  });

  it("should return a left either when the input validation fails", () => {
    const run = onSelfcareContractsMessageHandler({
      inputDecoder: IoTsType(ioSignContracts),
      input: { foo: "foo" },
      logger: { log: (s, _l) => () => console.log(s) },
      getById,
      sendMessage,
    });
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        _tag: "Left",
      })
    );
  });

  it("should return a left either when the issuer already exists", async () => {
    const input = [
      {
        id: "id",
        internalIstitutionID: "internalIstitutionID",
        state: "ACTIVE",
        institution: {
          address: "address",
          description: "description",
          digitalAddress: "digitalAddress",
          taxCode: "taxCode",
        },
        billing: {
          vatNumber: "id",
        },
        product: "prod-io-sign",
      },
    ];
    const run = onSelfcareContractsMessageHandler({
      inputDecoder: IoTsType(ioSignContracts),
      input,
      logger: { log: (s, _l) => () => console.log(s) },
      getById,
      sendMessage,
    });
    const result = await run();
    expect(isLeft(result)).toBe(true);
    expect.assertions(2);
    if (result._tag === "Left") {
      expect(result.left.message).toBe("An issuer with this id already exists");
    }
  });

  it("should call IssuerMessage function", async () => {
    const response = {
      status: 404,
    } as Response;

    const IssuerMessageSpy = vi.spyOn(issuerMessage, "IssuerMessage");
    const input = [
      {
        id: "id",
        internalIstitutionID: "internalIstitutionID",
        state: "ACTIVE",
        institution: {
          address: "address",
          description: "description",
          digitalAddress: "digitalAddress",
          taxCode: "taxCode",
        },
        billing: {
          vatNumber: "vatNumber",
        },
        product: "prod-io-sign",
      },
    ];
    const run = onSelfcareContractsMessageHandler({
      inputDecoder: IoTsType(ioSignContracts),
      input,
      logger: { log: (s, _l) => () => console.log(s) },
      getById,
      sendMessage,
    });
    await run();
    expect(IssuerMessageSpy).toHaveBeenCalled();
  });
});
