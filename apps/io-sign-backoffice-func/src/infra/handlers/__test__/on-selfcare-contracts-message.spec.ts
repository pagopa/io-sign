import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { it, describe, expect, vi, beforeAll } from "vitest";
import { onSelfcareContractsMessageHandler } from "../on-selfcare-contracts-message";
import { ioSignContracts } from "@/infra/selfcare/contract";
import * as issuerMessage from "@/infra/slack/issuer-message";
import {
  Institution,
  InstitutionRepository,
} from "@/infra/selfcare/institution";
import { Issuer, IssuerRepository } from "@/infra/back-office/issuer";
import { SlackRepository } from "@/infra/slack/message";
import { IoTsType } from "../validation";

describe("onSelfcareContractsMessage handler", () => {
  let issuerRepository: IssuerRepository;
  let institutionRepository: InstitutionRepository;
  let slackRepository: SlackRepository;

  const issuer: Issuer = {
    id: "id",
    type: "PA",
    externalId: "externalId",
    institutionId: "institutionId",
    supportEmail: "supportEmail",
    status: "active",
  };

  const selfcareInstitution: Institution = {
    supportEmail: "supportEmail",
    description: "description",
  };

  const mocks = { issuer, selfcareInstitution };

  beforeAll(() => {
    issuerRepository = {
      getById: (id) =>
        mocks.issuer.id === id
          ? TE.right(O.some(mocks.issuer))
          : TE.right(O.none),
    };
    institutionRepository = {
      getById: () => TE.right(O.some(mocks.selfcareInstitution)),
    };
    slackRepository = {
      sendMessage: () => TE.right(undefined),
    };
  });

  it("should return a left either when the input validation fails", () => {
    const run = onSelfcareContractsMessageHandler({
      inputDecoder: IoTsType(ioSignContracts),
      input: { foo: "foo" },
      issuerRepository,
      slackRepository,
      institutionRepository,
      logger: { log: (s, _l) => () => console.log(s) },
    });
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        _tag: "Left",
      })
    );
  });

  it("should return a left either when the issuer already exists", () => {
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
      issuerRepository,
      slackRepository,
      institutionRepository,
      logger: { log: (s, _l) => () => console.log(s) },
    });
    expect(run()).resolves.toEqual(
      expect.objectContaining({
        _tag: "Left",
      })
    );
  });

  it("should call IssuerMessage function", async () => {
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
      issuerRepository,
      slackRepository,
      institutionRepository,
      logger: { log: (s, _l) => () => console.log(s) },
    });
    await run();
    expect(IssuerMessageSpy).toHaveBeenCalled();
  });
});
