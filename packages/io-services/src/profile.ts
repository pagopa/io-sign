import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { pipe, flow } from "fp-ts/lib/function";
import { IOApiClient } from "./client";

export type RetriveUserProfileSenderAllowed = (
  fiscal_code: FiscalCode
) => TE.TaskEither<Error, boolean>;

export const makeRetriveUserProfileSenderAllowed =
  (ioApiClient: IOApiClient): RetriveUserProfileSenderAllowed =>
  (fiscal_code: FiscalCode) =>
    pipe(
      TE.tryCatch(
        () =>
          ioApiClient.getProfile({
            fiscal_code,
          }),
        E.toError
      ),
      TE.chain(
        flow(
          E.mapLeft(() => new Error("Unable to retrieve the user profile!")),
          E.chainW((response) => {
            switch (response.status) {
              case 200:
                return E.right(response.value);
              case 404:
                return E.left(new Error(`User profile not found!`));
              default:
                return E.left(
                  new Error(`An error occurred while getting the profile!`)
                );
            }
          }),
          TE.fromEither
        )
      ),
      TE.map((userProfile) => userProfile.sender_allowed)
    );
