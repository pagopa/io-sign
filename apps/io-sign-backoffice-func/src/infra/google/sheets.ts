import { Auth, google } from "googleapis";

import { constVoid, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { User } from "@io-sign/io-sign/institution";

type GoogleEnvironment = {
  google: {
    auth: Auth.GoogleAuth;
    spreadsheetId: string;
  };
};

const rows = (users: User[], institutionName: string) =>
  users.map((user) => ({
    values: [
      {},
      {},
      {
        userEnteredValue: {
          stringValue: institutionName
        }
      },
      {
        userEnteredValue: {
          stringValue: user.name
        }
      },
      {
        userEnteredValue: {
          stringValue: user.surname
        }
      },
      {
        userEnteredValue: {
          stringValue: user.email
        }
      }
    ]
  }));

export const saveUsersToSpreadsheet =
  (users: User[], institutionName: string) => (r: GoogleEnvironment) => {
    const sheets = google.sheets({ version: "v4", auth: r.google.auth });
    const requestBody = {
      spreadsheetId: r.google.spreadsheetId,
      requestBody: {
        requests: [
          {
            appendCells: {
              sheetId: 0,
              rows: rows(users, institutionName),
              fields: "userEnteredValue"
            }
          }
        ]
      }
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
