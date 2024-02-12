import { it, describe, expect, vi, beforeEach } from "vitest";
import * as TE from "fp-ts/lib/TaskEither";
import { onSelfcareContractsMessageHandler } from "../on-selfcare-contracts-message";
import { ioSignContracts } from "@/infra/selfcare/contract";
import * as issuerMessage from "@/infra/slack/issuer-message";
import { IoTsType } from "../validation";
import { isLeft } from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { GetById, Issuer } from "@/infra/back-office/issuer";
import { SendMessage } from "@/infra/slack/message";

const issuer: Issuer = {
  id: "id",
  type: "PA",
  externalId: "externalId",
  institutionId: "27e11a61-85bb-4dd5-95ff-d7f337058d99",
  supportEmail: "foo.bar@pagopa.it",
  status: "active",
};

const mocks = { issuer };

type FunctionsTestContext = {
  getById: GetById["getById"];
  sendMessage: SendMessage["sendMessage"];
};

beforeEach<FunctionsTestContext>((ctx) => {
  ctx.getById = (id, institutionId) =>
    mocks.issuer.id === id && mocks.issuer.institutionId === institutionId
      ? TE.right(O.some(issuer))
      : TE.right(O.none);
  ctx.sendMessage = () => TE.right(undefined);
});

describe("onSelfcareContractsMessage handler", () => {
  it<FunctionsTestContext>("should return a left either when the input validation fails", ({
    getById,
    sendMessage,
  }) => {
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

  it<FunctionsTestContext>("should return a left either when the issuer already exists", async ({
    getById,
    sendMessage,
  }) => {
    const input = [
      {
        id: "id",
        internalIstitutionID: "27e11a61-85bb-4dd5-95ff-d7f337058d99",
        state: "ACTIVE",
        institution: {
          address: "address",
          description: "description",
          digitalAddress: "digitalAddress",
          taxCode: "id",
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
    const result = await run();
    expect(isLeft(result)).toBe(true);
    expect.assertions(2);
    if (result._tag === "Left") {
      expect(result.left.message).toBe("An issuer with this id already exists");
    }
  });

  it<FunctionsTestContext>("should call IssuerMessage function", async ({
    getById,
    sendMessage,
  }) => {
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
