import { it, describe, expect, vi, beforeEach } from "vitest";
import * as TE from "fp-ts/lib/TaskEither";
import { onSelfcareContractsMessageHandler } from "../on-selfcare-contracts-message";
import { ioSignContracts } from "@/infra/selfcare/contract";
import { IoTsType } from "../validation";
import { isLeft } from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";

import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: "service_account",
    private_key: "private_key",
    client_email: "client_email",
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

import { BackofficeApiClient, Issuer } from "@/infra/back-office/client";
import { Contact } from "@/index";

const issuer: Issuer = {
  id: "id",
  type: "PA",
  externalId: "externalId",
  institutionId: "27e11a61-85bb-4dd5-95ff-d7f337058d99",
  supportEmail: "foo.bar@pagopa.it",
  status: "active",
};

const contacts: Contact[] = [
  {
    name: "Nome",
    surname: "Cognome",
    email: "nome.cognome@contatto.pagopa.it",
  },
];

const mocks = { issuer, contacts };

vi.mock("@/infra/back-office/client", () => {
  const BackofficeApiClient = vi.fn();
  BackofficeApiClient.prototype.getIssuer = vi.fn(
    (k: { id: string; institutionId: string }) =>
      k.id === mocks.issuer.id && k.institutionId === mocks.issuer.institutionId
        ? TE.right(O.some(mocks.issuer))
        : TE.right(O.none)
  );
  BackofficeApiClient.prototype.getUsers = vi.fn(() =>
    TE.right(mocks.contacts)
  );
  return { BackofficeApiClient };
});

const mockSaveContactsToSpreadsheets = vi.hoisted(() =>
  vi.fn(() => vi.fn(() => TE.right(undefined)))
);

vi.mock("@/infra/google/sheets", () => ({
  saveContactsToSpreadsheets: mockSaveContactsToSpreadsheets,
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
      logger: { log: (s, _l) => () => console.log(s) },
      backofficeApiClient: new BackofficeApiClient("url", "api-key"),
      google: {
        auth,
        spreadsheetId: "",
      },
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
      logger: { log: (s, _l) => () => console.log(s) },
      backofficeApiClient: new BackofficeApiClient("url", "api-key"),
      google: {
        auth,
        spreadsheetId: "",
      },
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
      logger: { log: (s, _l) => () => console.log(s) },
      backofficeApiClient: new BackofficeApiClient("url", "api-key"),
      google: {
        auth,
        spreadsheetId: "",
      },
      slackWebhook: "https://my-web-hook",
    });
    await run();
    expect(sendMessageMock).toHaveBeenCalledTimes(2);
    expect(mockSaveContactsToSpreadsheets).toHaveBeenCalledWith(
      mocks.contacts,
      input[0].institution.description
    );
  });
});
