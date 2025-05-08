import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import {
  ActionNotAllowedError,
  EntityNotFoundError,
  TooManyRequestsError
} from "../../error";
import { HttpBadRequestError } from "../http/errors";
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
          ioApiClient.client.getProfile({
            fiscal_code
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
                return E.left(
                  new EntityNotFoundError(`User profile not found!`)
                );
              case 403:
                return E.left(
                  new ActionNotAllowedError(
                    `You are not allowed to issue requests for this user!`
                  )
                );
              case 429:
                return E.left(new TooManyRequestsError(`Too many requests!`));
              default:
                return E.left(
                  new HttpBadRequestError(
                    `An error occurred while getting the profile!`
                  )
                );
            }
          }),
          TE.fromEither
        )
      ),
      TE.map((userProfile) => userProfile.sender_allowed)
    );
