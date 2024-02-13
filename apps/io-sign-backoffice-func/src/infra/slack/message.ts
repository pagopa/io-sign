import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { isSuccessful } from "@io-sign/io-sign/infra/client-utils";
import { dispatcher } from "../http/fetch";

export const sendMessage = (message: string) => (r: { slackWebhook: string }) =>
  pipe(
    TE.tryCatch(
      () =>
        fetch(r.slackWebhook, {
          method: "POST",
          body: JSON.stringify({
            text: message,
          }),
          dispatcher,
        }),
      E.toError
    ),
    TE.filterOrElse(
      isSuccessful,
      () => new Error("The attempt to post message on slack failed.")
    ),
    TE.map(() => undefined)
  );
