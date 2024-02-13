import { google, Auth } from "googleapis";

import { constVoid, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { Contact } from "../../index";

type GoogleEnvironment = {
  google: {
    auth: Auth.GoogleAuth;
    spreadsheetId: string;
  };
};

const rows = (contacts: Contact[], institutionName: string) =>
  contacts.map((contact) => ({
    values: [
      {},
      {},
      {
        userEnteredValue: {
          stringValue: institutionName,
        },
      },
      {
        userEnteredValue: {
          stringValue: contact.name,
        },
      },
      {
        userEnteredValue: {
          stringValue: contact.surname,
        },
      },
      {
        userEnteredValue: {
          stringValue: contact.email,
        },
      },
    ],
  }));

export const saveContactsToSpreadsheets =
  (contacts: Contact[], institutionName: string) => (r: GoogleEnvironment) => {
    const sheets = google.sheets({ version: "v4", auth: r.google.auth });
    const requestBody = {
      spreadsheetId: r.google.spreadsheetId,
      requestBody: {
        requests: [
          {
            appendCells: {
              sheetId: 0,
              rows: rows(contacts, institutionName),
              fields: "userEnteredValue",
            },
          },
        ],
      },
    };
    return pipe(
      TE.tryCatch(
        () => sheets.spreadsheets.batchUpdate(requestBody),
        () =>
          new Error(
            "Can't write to google sheets. Check if the credentials used are correct and Sheets API is enabled."
          )
      ),
      TE.map(constVoid)
    );
  };
