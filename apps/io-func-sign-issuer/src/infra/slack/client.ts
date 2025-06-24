import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";

import { makeFetchWithTimeout } from "@io-sign/io-sign/infra/http/fetch-timeout";
import {
  defaultHeader,
  isSuccessful
} from "@io-sign/io-sign/infra/client-utils";

import { SlackConfig } from "./config";

export const makePostSlackMessage =
  (fetchWithTimeout = makeFetchWithTimeout()) =>
  (config: SlackConfig) =>
  (text: string) =>
    pipe(
      TE.tryCatch(
        () =>
          fetchWithTimeout(`${config.webhookUrl}`, {
            method: "POST",
            body: JSON.stringify({
              text
            }),
            headers: defaultHeader
          }),
        E.toError
      ),
      TE.filterOrElse(
        isSuccessful,
        () => new Error("The attempt to post message on slack failed.")
      ),
      TE.map((response) => response.text)
    );
