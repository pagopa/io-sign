import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { fetch } from "undici";
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
      (response) => response.status === 200,
      () => new Error("The attempt to post message on slack failed.")
    ),
    TE.map(() => undefined)
  );
