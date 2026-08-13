import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { flow, pipe } from "fp-ts/lib/function";

import { EmailAddress } from "./models/EmailAddress";
import {
  ActionNotAllowedError,
  EntityNotFoundError,
  TooManyRequestsError
} from "../../error";
import { IoProfileClientWithApiKey } from "./client";

export type GetValidatedEmailByFiscalCode = (
  fiscalCode: FiscalCode
) => TE.TaskEither<Error, EmailAddress>;

export const makeGetValidatedEmailByFiscalCode =
  (ioProfileClient: IoProfileClientWithApiKey): GetValidatedEmailByFiscalCode =>
  (fiscalCode: FiscalCode) =>
    pipe(
      TE.tryCatch(
        () =>
          ioProfileClient.client.getProfile({
            fiscal_code: fiscalCode
          }),
        E.toError
      ),
      TE.chain(
        flow(
          E.mapLeft(() => new Error("Unable to retrieve the user profile!")),
          E.chainW((response) => {
            switch (response.status) {
              case 200: {
                const profile = response.value;
                if (!profile.is_email_validated || !profile.email) {
                  return E.left(
                    new ActionNotAllowedError(
                      "The user does not have a validated email address."
                    )
                  );
                }
                return E.right(profile.email);
              }
              case 401:
                return E.left(
                  new ActionNotAllowedError(
                    "You are not allowed to retrieve this user profile."
                  )
                );
              case 404:
                return E.left(
                  new EntityNotFoundError("User profile not found.")
                );
              case 429:
                return E.left(new TooManyRequestsError("Too many requests."));
              default:
                return E.left(
                  new Error(
                    "An unexpected error occurred while retrieving the user profile."
                  )
                );
            }
          }),
          TE.fromEither
        )
      )
    );
