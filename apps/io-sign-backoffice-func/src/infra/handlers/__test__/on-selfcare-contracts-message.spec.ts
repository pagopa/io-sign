import { it, describe, expect, vi } from "vitest";
import * as TE from "fp-ts/lib/TaskEither";
import { onSelfcareContractsMessageHandler } from "../on-selfcare-contracts-message";
import { ioSignContracts } from "@/infra/selfcare/contract";
import { IoTsType } from "../validation";
import { isLeft } from "fp-ts/lib/Either";

import { User } from "@io-sign/io-sign/institution";
import { Issuer, IssuerKey, IssuerRepository } from "@/issuer";

import { google } from "googleapis";
import { ApiKeyRepository } from "@/api-key";
import { InstitutionRepository } from "@/institution";
import { UserRepository } from "@/user";

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: "service_account",
    private_key: "private_key",
    client_email: "client_email",
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const issuer: Issuer = {
  id: "id",
  type: "PA",
  externalId: "externalId",
  institutionId: "27e11a61-85bb-4dd5-95ff-d7f337058d99",
  supportEmail: "foo.bar@pagopa.it",
  status: "active",
};

const users: User[] = [
  {
    name: "Nome",
    surname: "Cognome",
    email: "nome.cognome@contatto.pagopa.it",
  },
];

const mocks = { issuer, users };

const logger = {
  log: () => () => {},
};

class TestRepository
  implements
    ApiKeyRepository,
    IssuerRepository,
    InstitutionRepository,
    UserRepository
{
  async getApiKeyById() {
    return undefined;
  }
  async getIssuerByKey(k: IssuerKey) {
    return k.id === mocks.issuer.id &&
      k.institutionId === mocks.issuer.institutionId
      ? mocks.issuer
      : undefined;
  }
  async getInstitutionById(id: string) {
    return undefined;
  }
  async getUsersByInstitutionId() {
    return mocks.users;
  }
}

const testRepository = new TestRepository();

const mocksaveUsersToSpreadsheet = vi.hoisted(() =>
  vi.fn(() => vi.fn(() => TE.right(undefined)))
);

vi.mock("@/infra/google/sheets", () => ({
  saveUsersToSpreadsheet: mocksaveUsersToSpreadsheet,
}));

const sendMessageMock = vi.hoisted(() =>
  vi.fn(() => vi.fn(() => TE.right(undefined)))
);

vi.mock("@/infra/slack/message", () => ({
  sendMessage: sendMessageMock,
}));

describe("onSelfcareContractsMessage handler", () => {
  it("should return a left either when the input validation fails", () => {
    const run = onSelfcareContractsMessageHandler({
      inputDecoder: IoTsType(ioSignContracts),
      input: { foo: "foo" },
      logger,
      google: {
        auth,
        spreadsheetId: "",
      },
      userRepository: testRepository,
      issuerRepository: testRepository,

      slackWebhook: "https://my-web-hook",
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
      logger,
      google: {
        auth,
        spreadsheetId: "",
      },
      userRepository: testRepository,
      issuerRepository: testRepository,
      slackWebhook: "https://my-web-hook",
    });
    const result = await run();
    expect(isLeft(result)).toBe(true);
    expect.assertions(2);
    if (result._tag === "Left") {
      expect(result.left.message).toBe("An issuer with this id already exists");
    }
  });

  it("sends two messages (onboarding, contact) and stores contacts to spreadsheet", async () => {
    const input = [
      {
        id: "id",
        internalIstitutionID: "internalIstitutionID",
        state: "ACTIVE",
        institution: {
          address: "address",
          description: "Comune di Test",
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
      logger,
      google: {
        auth,
        spreadsheetId: "",
      },
      userRepository: testRepository,
      issuerRepository: testRepository,
      slackWebhook: "https://my-web-hook",
    });
    await run();
    expect(sendMessageMock).toHaveBeenCalledTimes(2);
    expect(mocksaveUsersToSpreadsheet).toHaveBeenCalledWith(
      mocks.users,
      input[0].institution.description
    );
  });
});
