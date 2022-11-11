import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

import { pipe } from "fp-ts/lib/function";

import { NewMessage } from "@pagopa/io-functions-services-sdk/NewMessage";

import { IOApiClient } from "./client";

export const makesubmitMessageForUser =
  (client: IOApiClient) => (fiscal_code: FiscalCode) => (message: NewMessage) =>
    pipe(
      TE.tryCatch(
        () => client.submitMessageforUser({ fiscal_code, message }),
        E.toError
      )
    );
